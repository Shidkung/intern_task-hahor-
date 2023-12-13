// dto/asset.dto.ts

export class AssetDto {
    NAME: string;
    GROUP: string;
    IMG:string;
    token:string;
    'cover-image': object;
    'bathroom-images': object;
    'bedroom-images': object;
    'livingroom-images': object;
    'kitchen-images': object;
    'facility-images':object;
    'view-images':object;
    'plan-image':object;
    type:string;
    project:string;
    available_date:string;
    house_number_pre:number;
    house_number_post:number;
    floor_start:string;
    floor_end :string;
    building:string;
    unit:number;
    direction:string;
    area_size_m2:number;
    car_parking:number;
    bike_parking:number;
    bedroom:number;
    livingroom:number;
    bathroom:number;
    kitchen:number;
    storage:number;
    notes : string;
    rent_price:string;
    sell_price:string;
    electric_installation_number:number;
    electric_ca:number;
    accept_agent:boolean;
    owner: object
    pet_friendly:boolean;
    sources : object;
    // Add other properties based on your CSV columns for assets
  }
  