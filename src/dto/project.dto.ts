// dto/project.dto.ts

export class ProjectDto {
    signature:string;
    code : string;
    zone: string;
    map_url : string;
    name: string;
    name_eng: string;
    address: string;
    address_eng: string;
    number:string;
    sub_district: string;
    sub_district_eng: string;
    district:string;
    district_eng: string;
    province: string;
    province_eng: string;
    type : string;
    pet_frienly : boolean;
    location : string;
    'logo-image':any;
    soi:string;
    soi_eng:string;
    // Add other properties based on your CSV columns for projects
}
  