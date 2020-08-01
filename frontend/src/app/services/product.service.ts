import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {environment} from "../../environments/environment";
import {ProductModelServer, ServerResponse} from "../models/product.model";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private SERVER_URL = environment.SERVER_URL;
  constructor(private http: HttpClient) { }

  /* This is to fetch all the products from backend */
  getAllProducts(numberofResults = 10) : Observable<ServerResponse> {
     return this.http.get<ServerResponse>(this.SERVER_URL+'/products', {
       params: {
         limit: numberofResults.toString()
       }
     });
  }


  /* GET SINGLE PRODUCT FROM SERVER */
  getSingleProduct(id: number): Observable<ProductModelServer>{
     return this.http.get<ProductModelServer>(this.SERVER_URL + '/products/' + id)
  }

  getProductsFromCategory(catName: String): Observable<ProductModelServer[]> {
    return this.http.get<ProductModelServer[]>(this.SERVER_URL + 'products/category/' + catName);
  }


}
