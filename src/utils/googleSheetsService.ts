import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { DailyLogEntry, CategoryId } from '../types';
import { formatDateRu, getDayOfWeekRu, calculatePredictedCalories } from './dqsEngine';

// Ensure Firebase app instance is initialized safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem('dqs_google_access_token');

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const storedToken = localStorage.getItem('dqs_google_access_token');
      if (storedToken) {
        cachedAccessToken = storedToken;
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('dqs_google_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Не удалось получить Access Token от Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem('dqs_google_access_token', cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  cachedAccessToken = null;
  localStorage.removeItem('dqs_google_access_token');
  await auth.signOut();
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem('dqs_google_access_token');
};

// Category order matching spreadsheet
const CATEGORY_ORDER: CategoryId[] = [
  'vegetables',
  'fruits',
  'lean_proteins',
  'dairy',
  'whole_grains',
  'healthy_drinks',
  'nuts_seeds',
  'oils_fats',
  'refined_grains',
  'processed_meats',
  'sweets',
  'sugary_drinks_alcohol',
];

const HEADER_ROW = [
  'День #',
  'Дата',
  'День недели',
  'DQS за день',
  'Вес (кг)',
  'Калории факт',
  'Калории прогноз DQS',
  'Дельта ккал',
  'Овощи',
  'Фрукты',
  'Мясо/Белок',
  'Молочка',
  'ЦЗ Гарнир',
  'Полезные напитки',
  'Орехи',
  'Масло (5г)',
  'Обычный гарнир',
  'Ультра-обработка',
  'Сладкое',
  'Нездоровые напитки',
];

/**
 * Creates a new DQS Marathon Google Spreadsheet in the user's Google Drive
 */
export async function createDqsGoogleSheet(token: string): Promise<{ id: string; url: string }> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Дневник Питания DQS — Марафон (Автосинхронизация)',
      },
      sheets: [
        {
          properties: {
            title: 'Дневник DQS',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ошибка создания Google Таблицы: ${errText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Add Headers & initial formatting
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Дневник DQS!A1:T1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [HEADER_ROW],
      }),
    }
  );

  return { id: spreadsheetId, url: spreadsheetUrl };
}

/**
 * Exports/Syncs all DailyLogEntry logs into Google Sheet
 */
export async function syncLogsToGoogleSheet(
  spreadsheetId: string,
  logs: DailyLogEntry[],
  token: string
): Promise<number> {
  // Sort logs by date ascending
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  const rows = sortedLogs.map((log, index) => {
    const predictedKcal = log.predictedCalories ?? calculatePredictedCalories(log.servings);
    const actualKcal = log.actualCalories ?? '';
    const deltaKcal = typeof actualKcal === 'number' ? actualKcal - predictedKcal : '';

    return [
      index + 1, // День #
      formatDateRu(log.date),
      getDayOfWeekRu(log.date),
      log.calculatedScore,
      log.weight ?? '',
      actualKcal,
      predictedKcal,
      deltaKcal,
      ...CATEGORY_ORDER.map((catId) => log.servings[catId] || 0),
    ];
  });

  // Write full range (Headers + Rows)
  const fullValues = [HEADER_ROW, ...rows];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Дневник DQS!A1:T${
      fullValues.length
    }?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: fullValues,
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    throw new Error(`Ошибка записи данных в Google Таблицу: ${errText}`);
  }

  return logs.length;
}
