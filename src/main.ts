// script-all.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiService } from './api/api.service';
import * as gdrive from 'gdrive';
import * as fs from 'fs-extra';
import * as ExcelJS from 'exceljs';
import * as csvParser from 'csv-parser';
import { ProjectDto } from './dto/project.dto';
import { AssetDto } from './dto/asset.dto';
import { google } from 'googleapis';
import streamToBuffer from 'stream-to-buffer'
import { json } from 'stream/consumers';
import { resolve } from 'path';
import { JWT } from 'google-auth-library';
import * as expandUrl from 'expand-url';
import * as validUrl from 'valid-url';
import * as path from 'path';
import * as archiver from 'archiver';
import axios from 'axios';
import { types } from 'util';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const apiService = app.get(ApiService);
  // Process Assets CSV
  try {
    const data = await apiService.login('dev-script@hahor.com','scriptHaH24!')
  // Process Projects CSV
  const projectCsvFilePath = 'csv/hahor_project.csv';
  await processProjects(apiService, projectCsvFilePath,data.access_token);
  console.log("Project Success")
  const check = await apiService.getproject(data.access_token);
  console.log("Check Success")
    const assetCsvFilePath = 'csv/hahorasset.csv';
    await processAssets(apiService, assetCsvFilePath,data.access_token,check.data);
 } catch (error) {
    console.error('Error processing assets:', error);
 }
  
  console.log("Asset Success")
  app.close();
}

async function processProjects(apiService: ApiService, csvFilePath: string,token:string): Promise<void> {
  const dataarray=[]
  const fs = require('fs');
  const csv = require('fast-csv');
  
  const filePath = csvFilePath;
  
  // Create a readable stream to read the CSV file
  const stream = fs.createReadStream(filePath);
  
  // Create a CSV parser
  const csvStream = csv.parse({ headers: true });
  
  // Pipe the CSV stream to the parser
  stream.pipe(csvStream);
  // Handle the 'data' event, which is emitted for each row in the CSV file
  csvStream.on('data',(row) => {
    // Process the entire row
    //console.log('Row:',row); 
    dataarray.push(row)
  });
  // Handle the 'end' event, which is emitted when the entire CSV file has been parsed
  csvStream.on('end', async() => {
    for(let i =0 ;i<dataarray.length;i++){
      let address =''
      var array = dataarray[i]
   

      const shortUrl = array['GG MAP'];
      const location = await expandShortURL(shortUrl);
      const latlong = getLatLngFromGoogleMapsURL(location)
      console.log(latlong)
      //console.log('Short URL:', shortUrl);
      //console.log(array.SOI)
      if(array.TYPE == undefined || array.TYPE == null || array.TYPE ==""){
        array.TYPE='condo'
      }
     const projectdata = new ProjectDto
     if(shortUrl==" "){
      projectdata.location = " "
    }
    else{
      projectdata.location = String(latlong.lat)+" , "+String(latlong.long)
    }
    console.log(projectdata.location)
    if(array.Zone == 'KU'){
      array.Zone = '8d153755-df2d-448e-851c-0240def643b8'
      projectdata.code = array.Zone
      projectdata.zone = array.Zone
    }
    else{
    }
     projectdata.name = array.ชื่อ
     projectdata.name_eng = array.NAME
     projectdata.map_url = array['GG MAP']
     projectdata.signature = array.Code
     projectdata.address = array['RD.']
     projectdata.address_eng = array['RD.']
     
     projectdata.type = array.TYPE
     projectdata.sub_district = ''
     projectdata.sub_district_eng = array['SUB-DISTRIC']
     projectdata.district = ''
     projectdata.district_eng =array['DISTRICT']
    
     projectdata.province = ""
     projectdata.province_eng = ""
     projectdata.number = "1"
     projectdata['logo-image']=null
     projectdata.soi = ""
     projectdata.soi_eng = array.SOI
     projectdata.pet_frienly = true
     console.log(projectdata)
    
     try{
      const projectResponse = await apiService.createProject(projectdata,token);
      const projectId = projectResponse.id;  
      console.log(projectId)      
     }
     catch(error){
      if (error.response) {
        console.error('Response Data:', error.response.data);
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      console.error('Error Config:', error.config);
    }        
    }
    console.log('CSV file successfully processed.');
    resolve()
  });
  // Handle errors
  csvStream.on('error', (error) => {
  console.error('Error reading CSV file:', error.message);
  });
}
async function processAssets(apiService: ApiService, csvFilePath: string, token:string,projectdata:any): Promise<void> {
  const dataarray=[]
  const fs = require('fs');
  const csv = require('fast-csv');
  
  const filePath = csvFilePath;
  // Create a readable stream to read the CSV file
  const stream = fs.createReadStream(filePath);
  // Create a CSV parser
  const csvStream = csv.parse({ headers: true });
  // Pipe the CSV stream to the parser
  stream.pipe(csvStream);
  // Handle the 'data' event, which is emitted for each row in the CSV file
  csvStream.on('data',(row) => {
    // Process the entire row
    //console.log('Row:',row); 
    dataarray.push(row)
  });
  // Handle the 'end' event, which is emitted when the entire CSV file has been parsed
  csvStream.on('end', async() => {
    for(let i =0 ;i<dataarray.length;i++){
      let address =''
      let planimage =[]
      let otherimages =[]
      let coverImage = []
      let livingroomimages = []
      let bathroomimage = []
      let bedroomimage=[]
      let facilityimage=[]
      let kitchenimage = []
      let viewimage=[]
      var array = dataarray[i]
      let IMG = array.IMG
      let folderId = ""
      const forcontact = Object.entries(array)
      let contact = []
      let project 
      let ownertype = "self"
      let source = []
      let datasource ={
        caption : '',
        url :'',
        post_date:''
      }
      IMG = IMG.split("/")
      if(IMG[3]==undefined){
      }
      else {
        folderId = IMG[3].replace('open?id=', '');
        //console.log('Folder ID:', folderId);
        // Download folder from Google Drive
        let folderpath = "KU\\"+array['NAME']+"\\"+array['ID']
        console.log(folderpath)
        const data = await getFilesInFolder(folderpath)
        for(let i =0;i<data.length;i++){
          let jpg = data[i].split("\\")
          let split = jpg[3].split("_")
          let types = split[1]
          console.log(split)
          switch (types){
              case 'BATH':
                bathroomimage.push(data[i])
                break;
              case 'BED':
                bedroomimage.push(data[i])
                break;
              case 'FACI':
                facilityimage.push(data[i])
                break;
              case 'KIT':
                kitchenimage.push(data[i])
                break;
              case 'VIEW':
                viewimage.push(data[i])
                break;
              case 'LIVING':
                livingroomimages.push(data[i])
                break;
              case 'COVER':
                  coverImage.push(data[i])
                  break;
              case 'PLAN':
                  planimage.push(data[i])
                  break;
              default:
                otherimages.push(data[i])
                break;
          }
        }
      }
      for(let i =0; i<forcontact.length;i++){
        
        if(forcontact[i][0].toLowerCase().slice(0,7)=="source"){
          if(forcontact[i][1]==''){}
            datasource.url = String(forcontact[i][1])  
        }
        if(forcontact[i][0].toLowerCase().slice(0,7)=="column3"){
        }
        if(forcontact[i][0].toLowerCase().slice(0,9)=="post date"){
        datasource.post_date = String(convertToISO8601(forcontact[i][1]))  
        } 
      }
      source.push(datasource)
      //console.log(datasource)
      for(let i = 0; i<forcontact.length;i++){
        if(forcontact[i][0].toLowerCase().slice(0,3)=="tel"){
    
          if(forcontact[i][1]==""||forcontact[i][1]=="-"){
          }
          else{
          let data = {
              channel : 'phone',
              value : forcontact[i][1]
          }
          contact.push(data)
        }
        }
        else if(forcontact[i][0].toLowerCase().slice(0,3)=="fb"){
     
          if(forcontact[i][1]==""||forcontact[i][1]=="-"){
        }else{
          let data = {
          channel : 'facebook_link',
          display_name :forcontact[i][1],
          value : forcontact[i+1][1]
      }
      contact.push(data)}
        }
        else if(forcontact[i][0].toLowerCase().slice(0,5)=="line"){
          if(forcontact[i][1]=="" ||forcontact[i][1]=="-" ){
        }else{
           let data = {
          channel : 'line_id',
          display_name :forcontact[i][1],
          value : forcontact[i+1][1]
      }
      contact.push(data)}
        }
      }
      for(let i=0;i<projectdata.length;i++){
          let ID = array.ID
          if(ID.slice(2,6)==projectdata[i].signature){
           // console.log(projectdata[i].signature)
            project = projectdata[i].id
            //console.log(project)
          }
      }
      if(array.TYPE ==null||array.TYPE==undefined||array.TYPE==""){
        array.TYPE = 'loft'
      }
      let assetData = new AssetDto
      if(array.STUDIO == "TRUE"){
        array.TYPE = 'studio'
      }
      else{
        array.TYPE = 'normal'
      }
     
     if(array['    CAR'] == ""){
      array['    CAR']='0'
     }
     if(array['    BIKE'] == ""){
      array['    BIKE']='0'
     }
     if(array['KITCHEN'] == ""){
      array['KITCHEN']='0'
     }
     switch(array['IS AGENT']){
      case 'FALSE':
        array['IS AGENT'] = false
        ownertype = "self"
        break;
      case 'TRUE':
        array['IS AGENT'] = true
        ownertype = "agent"
        break;
     }
    // console.log(array)
    // console.log(ownertype)
    // console.log(contact)
    const rent = array['RENT'].replace(",","")
    if(bathroomimage.length==0){
    }
    else{
      assetData['bathroom-images'] = bathroomimage
    }
    if(bedroomimage.length==0){
    }
    else{
      assetData['bedroom-images'] = bedroomimage
    }
    if(coverImage.length==0){
    }
    else{
      assetData['cover-image'] = coverImage
    }
    if(facilityimage.length==0){
    }
    else{
      assetData['facility-images'] = facilityimage
    }
    if(kitchenimage.length==0){
    }
    else{
      assetData['kitchen-images'] = kitchenimage
    }
    if(viewimage.length==0){
    }
    else{
      assetData['view-images'] = viewimage
    }
    if(planimage.length==0){
    }
    else{
      assetData['plan-image'] = planimage
    }
    if(livingroomimages.length==0){
    }
    else{
      assetData['livingroom-images'] = livingroomimages
    }
    if(array['FLOOR']==""){
    }else{
      assetData.floor_start = array['FLOOR']
      assetData.floor_end = array['FLOOR']
    }
    if(array['    BUILDING']==''){

    }
    else{
      assetData.building = array['    BUILDING']
    }
    if(array['NOTE'] ==''){}
    else{
      console.log(array['NOTE'])
    }
    if(array['SIZE']==""){}
    else{
      assetData.area_size_m2 = array['SIZE'].replace(" m²", "")
    }
    let avail = convertToISO8601(array['AVAILABLECONFIRM']) 
    if(avail == null){}
    else{assetData.available_date = convertToISO8601(array['AVAILABLECONFIRM'])}
    let sell = convertPriceStringToNumber(array.SELL)
    if(sell == '0'){}
    else{
      assetData.sell_price =convertPriceStringToNumber(array.SELL)
    }
    if(array['   DIRECTION'] == ''){
     }
    else{
      assetData.direction = String(array['   DIRECTION']).toLocaleLowerCase()
    }
    if(array['RENT']==""){
    }
    else{
      assetData.rent_price =rent.replace('฿ ',"")
    }
      assetData.project = project
      assetData.type = 'studio'
      assetData.bedroom = array.BED
      assetData.bathroom = array.BATH
      assetData.kitchen = array['KITCHEN']  
      assetData.car_parking = array['    CAR']
      assetData.bike_parking = array['    BIKE']
      if(contact.length==0 && array['NAME1']==""){
      }
      else{
        assetData.owner={
          type : ownertype,
          contacts : contact,
          nickname: array['NAME1']
        }
      } 
      
      assetData.sources = source
      console.log(assetData)
      console.log(assetData.owner)

      if(assetData.project == undefined){
        const fs = require('fs');
// Specify the path for the log file
  const logFilePath = 'example.log';
// Example usage
  fs.appendFileSync(logFilePath, 'dont have this project signature'+" "+array.ID.slice(2,6)+'\n');
  //console.log("dont have this project")
      }
      else{
        try{
        const response = await apiService.createAsset(assetData,token)
        console.log(response.id)
        }
        catch(error){
          if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
          } else if (error.request) {
            console.error('No response received. Request:', error.request);
          } else {
            console.error('Error setting up request:', error.message);
          }
          console.error('Error Config:', error.config);
          console.error('Body',error.Body)
        }
      }
      
    }
    console.log('CSV file successfully processed.');
    resolve()
  });
  // Handle errors
  csvStream.on('error', (error) => {
  console.error('Error reading CSV file:', error.message);
  });
}
async function sleep(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function downloadFolderFromDrive(folderId: string, apiKey: string, retryCount = 0): Promise<void> {
  const drive = google.drive({ version: 'v3', auth: apiKey });

  
  const MAX_RETRY_ATTEMPTS = 3; 
  try{
  const fileList = await drive.files.list({
    q: `'${folderId}' in parents`,
    fields: 'files(id, name, mimeType)',
  });

  const folderName = `downloaded_folder_${folderId}`;
  fs.mkdirSync(folderName);

  for (const file of fileList.data.files) {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      // Recursive call for sub-folders
      const delays = Math.floor(Math.random() * 10000) + 1000;
      await sleep(delays);
      await downloadFolderFromDrive(file.id!, apiKey);
      
    } else {
      const destPath = path.join(folderName, file.name!);
      const destStream = fs.createWriteStream(destPath);
      const response = await drive.files.get({ fileId: file.id!, alt: 'media' }, { responseType: 'stream' });
    
      await new Promise<void>((resolve, reject) => {
        response.data
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          })
          .pipe(destStream);
      });
    }
  }
} catch (error) {
  if (error.response && error.response.status === 403) {
    console.error('Insufficient permissions or quota exceeded. Check permissions and API quotas.');
  } else if (error.response && error.response.status === 429 && retryCount < MAX_RETRY_ATTEMPTS) {
    const delay = Math.pow(2, retryCount) * 1000;
    await sleep(delay)
    console.warn(`Rate limited. Retrying in ${delay / 1000} seconds...`);
        return downloadFolderFromDrive(folderId,apiKey, retryCount + 1);
  } else {
    throw error;
  }
}
}
async function getFilesInFolder(folderPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const fileArray: string[] = [];

    // Read files in the folder
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Error reading folder:', err);
        reject(err);
        return;
      }

      // Use a counter to keep track of the number of async operations
      let count = files.length;

      // Iterate through the files
      files.forEach((file) => {
        const filePath = path.join(folderPath, file);

        // Check if it's a file (not a subdirectory)
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error('Error checking file stats:', err);
            reject(err);
            return;
          }
          if (stats.isFile()) {
            // Add the file path to the array
            fileArray.push(filePath);
          }

          // Decrement the counter and resolve when all async operations are complete
          count--;
          if (count === 0) {
            resolve(fileArray);
          }
        });
      });
    });
  });
}
async function expandShortURL(shortURL) {
  try {
      let fullURL = " ";
      if (!shortURL) {
          throw new Error('Short URL is undefined or empty.');
      }
      if(shortURL.startsWith('https://')){
        fullURL = shortURL
      }
      else{
        fullURL = `https://${shortURL}`
      }
      // Add the protocol (https) to the shortURL

      const response = await fetch(fullURL, { method: 'HEAD', redirect: 'follow' });
      const finalURL = response.url;

      if (!finalURL) {
          throw new Error('Unable to retrieve the final URL.');
      }

      console.log('Expanded URL:', finalURL);
      return finalURL;
  } catch (error) {
      console.error('Error expanding short URL:', error.message);
  }
}
function getLatLngFromGoogleMapsURL(googleMapsURL) {
  // Extract the latitude and longitude from the URL
  const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const match = googleMapsURL.match(regex);

  if (match && match.length === 3) {
      const lat = parseFloat(match[1]);
      const long = parseFloat(match[2]);
      return { lat, long};
  } else {
      console.error('Unable to extract latitude and longitude from the URL.');
      return null;
  }
}
function convertToISO8601(dateString) {
  // Split the date string into components
  const dateComponents = dateString.split('/');
  if(dateString == ""){
    return null
  }
  // Parse the components as integers and validate
  const day = parseInt(dateComponents[1], 10);
  const month = parseInt(dateComponents[0], 10);
  const year = parseInt(dateComponents[2], 10);
  
  // Validate the parsed values
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error('Invalid date components');
  }

  // Create a Date object with the components
  const dateObject = new Date(year, month - 1, day); // month is zero-based in Date object

  // Validate the Date object
  if (isNaN(dateObject.getTime())) {
    throw new Error('Invalid date');
  }

  // Convert the Date object to ISO 8601 string
  const isoString = dateObject.toISOString();

  return isoString;
}
function convertPriceStringToNumber(price:string) {
  let sell = 0
  const data = price.split(" ")
  if(data[2] == 'M'){
   sell =  Number(data[1]) * 1000000
  }
  return String(sell)
}
function checkIfFolderExists(folderPath) {
  try {
      // Check if the folder exists
      const stats = fs.statSync(folderPath);

      // Check if it is a directory
      if (stats.isDirectory()) {
          console.log(`The folder ${folderPath} exists.`);
          return true;
      } else {
          console.log(`${folderPath} is not a directory.`);
          return false;
      }
  } catch (error) {
      // Handle the error if the folder does not exist
      if (error.code === 'ENOENT') {
          console.log(`The folder ${folderPath} does not exist.`);
          return false;
      } else {
          console.error('Error:', error.message);
          return false;
      }
  }
}

bootstrap();
