import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private products: ProductResponseModel[] = [];
  private Server_Url = environment.SERVER_URL;


  constructor(private http:HttpClient) { }

  getSingleOrder(orderId : number){
    return this.http.get<ProductResponseModel[]>(this.Server_Url + '/orders/' + orderId).toPromise();
  }
}

interface ProductResponseModel {
  id: number;
  title: string;
  description: string;
  price: number;
  quantityOrdered: number;
  image: string;
}
