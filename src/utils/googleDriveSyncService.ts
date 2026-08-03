import { exportAllDataToJson, importAllDataFromJson, DQSFullBackup } from './storage';

const DRIVE_FILE_NAME = 'DQS_App_Data_Backup.json';

interface DriveFileItem {
  id: string;
  name: string;
  modifiedTime: string;
}

/**
 * Searches Google Drive for existing DQS backup file created by this app
 */
export async function findDriveBackupFile(token: string): Promise<DriveFileItem | null> {
  const query = encodeURIComponent(`name = '${DRIVE_FILE_NAME}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Ошибкa авторизации Google (401). Срок действия токена истёк.');
    }
    const text = await res.text();
    throw new Error(`Ошибка поиска файла в Google Диск: ${text}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveFileItem;
  }
  return null;
}

/**
 * Saves current local application data to user's Google Drive
 */
export async function saveAppDataToDrive(token: string): Promise<{ fileId: string; modifiedTime: string }> {
  const jsonContent = exportAllDataToJson();
  const existingFile = await findDriveBackupFile(token);

  if (existingFile) {
    // Update existing file content
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: jsonContent,
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ошибка обновления бэкапа в Google Диск: ${errText}`);
    }

    const updated = await res.json();
    return {
      fileId: updated.id || existingFile.id,
      modifiedTime: new Date().toISOString(),
    };
  } else {
    // Create new file via multipart upload
    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
      description: 'Резервная копия данных DQS Дневника Питания',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ошибка создания бэкапа в Google Диск: ${errText}`);
    }

    const created = await res.json();
    return {
      fileId: created.id,
      modifiedTime: new Date().toISOString(),
    };
  }
}

/**
 * Downloads backup JSON from Google Drive and imports into local application
 */
export async function loadAppDataFromDrive(token: string): Promise<{
  success: boolean;
  modifiedTime?: string;
  backupObj?: DQSFullBackup;
}> {
  const existingFile = await findDriveBackupFile(token);
  if (!existingFile) {
    return { success: false };
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ошибка чтения бэкапа из Google Диск: ${errText}`);
  }

  const jsonText = await res.text();
  const imported = importAllDataFromJson(jsonText);

  if (!imported) {
    throw new Error('Файл бэкапа поврежден или имеет неверный формат');
  }

  try {
    const parsed = JSON.parse(jsonText) as DQSFullBackup;
    return {
      success: true,
      modifiedTime: existingFile.modifiedTime,
      backupObj: parsed,
    };
  } catch (e) {
    return { success: true, modifiedTime: existingFile.modifiedTime };
  }
}
