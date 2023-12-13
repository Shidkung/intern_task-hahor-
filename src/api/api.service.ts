// api.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { application } from 'express';

@Injectable()
export class ApiService {
  private apiUrl = 'https://hh-dev-api.iamparker.co';

  async login(email :string , password:string): Promise<any> {
    const data = {
        email : email,
        password : password
    }
    const response = await axios.post(`${this.apiUrl}/auth/login`,data);
    return response.data;
  }
  async getproject(token:any): Promise<any> {
     const response = await axios.get(`${this.apiUrl}/projects`,{headers:{
         Authorization : `Bearer ${token}`
     }});
    
    return response.data;
  }
  async createProject(projectData: any,token:any): Promise<any> {
     const response = await axios.post(`${this.apiUrl}/projects`,projectData,{headers:{
         Authorization : `Bearer ${token}`,
     }});
    
    return response.data;
  }

  async createAsset(assetData: any,token:any): Promise<any> {
    const response = await axios.post(`${this.apiUrl}/assets`, assetData,{
      headers:{
             Authorization : `Bearer ${token}`,
             "Content-Type": "multipart/form-data"
         }});
    return response.data;
  }
}
