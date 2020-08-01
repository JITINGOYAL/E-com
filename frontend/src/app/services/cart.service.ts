import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ProductService} from "./product.service";
import {OrderService} from "./order.service";
import {environment} from "../../environments/environment";
import {CartModelPublic, CartModelServer} from "../models/cart.model";
import {BehaviorSubject} from "rxjs";
import {Router} from "@angular/router";
import {ProductModelServer} from "../models/product.model";
import {NavigationExtras} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {NgxSpinnerService} from "ngx-spinner";

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private serverURL = environment.SERVER_URL;

  //Data variable to store the cart information on the client's local storage
  private CartDataClient: CartModelPublic = {
    total: 0,
    prodData: [{
      incart: 0,
      id:0
    }]
  };

  //Data variable to store cart information on the server
  private CartDataServer: CartModelServer = {
    total: 0,
    data: [{
      numInCart: 0,
      product: undefined
    }]
  };

  //OBSERVABLES FOR THE COMPONENTS TO SUBSCRIBE
  cartTotal$ = new BehaviorSubject<number>(0);
  cartData$ = new BehaviorSubject<CartModelServer>(this.CartDataServer);



  constructor(private http: HttpClient,
              private productService: ProductService,
              private orderService: OrderService,
              private router: Router,
              private toast: ToastrService,
              private spinner: NgxSpinnerService) {

    this.cartTotal$.next(this.CartDataServer.total);
    this.cartData$.next(this.CartDataServer);

    //Get the information from local storage( if any )
    let info: CartModelPublic = JSON.parse(localStorage.getItem('cart'));

    //check if the info variable is null or has some data in it
    if (info !== null && info !== undefined && info.prodData[0].incart !== 0){
      //local storage is not empty and has some information
      this.CartDataClient = info;


      //loop through each entry and put it in the CartDataServer object
      this.CartDataClient.prodData.forEach(p => {
        this.productService.getSingleProduct(p.id).subscribe((actualProductInfo: ProductModelServer) => {
          if (this.CartDataServer.data[0].numInCart === 0) {
            this.CartDataServer.data[0].numInCart = p.incart;
            this.CartDataServer.data[0].product = actualProductInfo;
            this.CalculateTotal();
            this.CartDataClient.total = this.CartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
          } else {
            this.CartDataServer.data.push({
              numInCart: p.incart,
              product: actualProductInfo
            });
            this.CartDataClient.total = this.CartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
          }
          this.cartData$.next({...this.CartDataServer});
        });
      });


    }
  }

  AddProductToCart(id: number,quantity?: number){
    this.productService.getSingleProduct(id).subscribe(prod => {
      //1. if the cart is empty
      if(this.CartDataServer.data[0].product === undefined){
        this.CartDataServer.data[0].product = prod;
        this.CartDataServer.data[0].numInCart = quantity !== undefined ? quantity : 1;
        this.CalculateTotal();
      //TODO CALCULATE TOTAL AMOUNT
        this.CartDataClient.prodData[0].incart = this.CartDataServer.data[0].numInCart;
        this.CartDataClient.prodData[0].id = prod.id;
        this.CartDataClient.total = this.CartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
        this.cartData$.next({...this.CartDataServer});
       // TODO DISPLAY A TOAST NOTIFICATION
        this.toast.success(`${prod.name} added to the cart`,'Product Added',{
          timeOut:1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });

      }

      //2. if the cart has some items
      else {
        let index = this.CartDataServer.data.findIndex(p => p.product.id === prod.id);  // -1 or a positive value
        //      a. if that item is already in cart
        if (index !== -1){
          if(quantity !== undefined && quantity <= prod.quantity){
            this.CartDataServer.data[index].numInCart = this.CartDataServer.data[index].numInCart < prod.quantity ? quantity : prod.quantity;
          }else{
            this.CartDataServer.data[index].numInCart < prod.quantity ? this.CartDataServer.data[index].numInCart++ : prod.quantity;
          }

          this.CartDataClient.prodData[index].incart = this.CartDataServer.data[index].numInCart;
          this.CalculateTotal();
          this.CartDataClient.total = this.CartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
          this.toast.info(`${prod.name} quantity updated in  the cart`,'Product Updated',{
            timeOut:1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          });

        } //END OF IF

        //      b. if that item is not in the cart
        else{
          this.CartDataServer.data.push({
            numInCart:1,
            product:prod
          });

          this.CartDataClient.prodData.push({
            incart:1,
            id: prod.id
          });


          //TODO TOAST NOTIFICATION
          localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
          this.toast.success(`${prod.name} added to the cart`,'Product Added',{
            timeOut:1500,
            progressBar: true,
            progressAnimation: 'increasing',
            positionClass: 'toast-top-right'
          });

          // TODO CALCULATE TOTAL AMOUNT
          this.CalculateTotal();
          this.CartDataClient.total = this.CartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
          this.cartData$.next({...this.CartDataServer});
        } //END OF ELSE
      }


    });
  }

  UpdateCartItem(index:number, increase: boolean){
    let data = this.CartDataServer.data[index];

    if(increase){
      data.numInCart < data.product.quantity ? data.numInCart++ : data.product.quantity;
      this.CartDataClient.prodData[index].incart = data.numInCart;
      //TODO CALCULATE TOTAL AMOUNT
      this.CalculateTotal();
      this.CartDataClient.total = this.CartDataServer.total;
      localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
      this.cartData$.next({...this.CartDataServer});
    }else{
      data.numInCart--;

      if(data.numInCart < 1){
        this.cartData$.next({...this.CartDataServer});
      }else{
        this.cartData$.next({...this.CartDataServer});
        this.CartDataClient.prodData[index].incart = data.numInCart;
        //TODO CALCULATE TOTAL AMOUNT
        this.CalculateTotal();
        this.CartDataClient.total = this.CartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
      }

    }
  }

  DeleteProductFromCart(index: number){
    if(window.confirm('Are you sure you want to remove the item?')){
      this.CartDataServer.data.splice(index, 1);
      this.CartDataClient.prodData.splice(index, 1);
      //TODO CALCULATE TOTAL AMOUNT
      this.CalculateTotal();
      this.CartDataClient.total = this.CartDataServer.total;

      if(this.CartDataClient.total === 0){
        this.CartDataClient = {total: 0, prodData: [{incart: 0, id:0}]};
        localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
      }else{
        localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
      }

      if(this.CartDataServer.total === 0){
        this.CartDataServer = {total: 0, data: [{numInCart: 0, product: undefined}]};
        this.cartData$.next({...this.CartDataServer});
      }else {
        this.cartData$.next({...this.CartDataServer});
      }

    }
    else{
      //if the user clicks the cancel button
      return;
    }
  }

  private CalculateTotal(){
    let Total = 0;

    this.CartDataServer.data.forEach(p => {
      const {numInCart} = p;
      const {price} = p.product;

      Total += numInCart * price;
    });
    this.CartDataServer.total = Total;
    this.cartTotal$.next(this.CartDataServer.total);
  }

  public CheckoutFromCart(userId : number){
    this.http.post(`${this.serverURL}/orders/payment`, null).subscribe((res: {success: boolean}) => {
      if(res.success){
        this.resetServerData();
        this.http.post(`${this.serverURL}/orders/new`, {
          userId: userId,
          products : this.CartDataClient.prodData
        }).subscribe((data:OrderResponse) => {

          this.orderService.getSingleOrder(data.order_id).then(prods => {
            if(data.success) {

              const navigationExtras: NavigationExtras = {
                state: {
                  message: data.message,
                  products: prods,
                  orderId: data.order_id,
                  total: this.CartDataClient.total
                }
              };

              //TODO HIDE SPINNER
              this.spinner.hide().then();
              this.router.navigate(['/thankyou'], navigationExtras).then(p => {
                this.CartDataClient = {total: 0, prodData: [{incart: 0, id:0}]};
                this.cartTotal$.next(0);
                localStorage.setItem('cart', JSON.stringify(this.CartDataClient));
              });

            }
          });
        });


      }else{
        this.spinner.hide().then();
        this.router.navigateByUrl(`/checkout`).then();
        this.toast.error(`Sorry, failed to book the order`,'Order Status',{
          timeOut:1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        });
      }
    });
  }

  private resetServerData() {
    this.CartDataServer = {total: 0, data: [{numInCart: 0, product: undefined}]};

    this.cartData$.next({...this.CartDataServer});
  }

  CalculateSubTotal(index): number{
    let subTotal = 0;

    const p = this.CartDataServer.data[index];
    //@ ts-ignore
    subTotal =  p.product.price * p.numInCart;

    return subTotal;
  }

}

interface OrderResponse {
  order_id: number;
  success: boolean;
  message: string;
  products : [{
    id: string,
    numInCart: string
  }]
}
