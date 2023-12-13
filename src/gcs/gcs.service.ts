// gcs.service.ts

import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsService {
  private readonly storage;

  constructor() {
    this.storage = new Storage({
      keyFilename: 'path/to/your/keyfile.json', // Path to your downloaded JSON key file
      projectId: 'your-project-id', // Replace with your Google Cloud project ID
    });
  }

  async listFiles(bucketName: string) {
    const [files] = await this.storage.bucket(bucketName).getFiles();

    return files;
  }

  async downloadFile(bucketName: string, fileName: string) {
    const [file] = await this.storage.bucket(bucketName).file(fileName).download();

    return file;
  }
}
