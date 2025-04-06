import { HttpClient } from "@angular/common/http";
import { API_BASE } from "../globals";
import { Injectable, inject } from "@angular/core";
import { CookieService } from "ngx-cookie-service";

@Injectable({ providedIn: 'root' })
export class APIService {
    private http:HttpClient = inject(HttpClient);
    private cookie:CookieService = inject(CookieService);
    
    // request method
    public request<T>(method: HttpMethod, url: string, params: any, responseType: string = 'json'){
        const headers:any = {};
        const session = this.cookie.get('auth_session');
        const loggedIn:boolean = session != undefined && session != null;
        // if user is logged in then add authorization header
        if(loggedIn) headers['Authorization'] = "Bearer " + this.cookie.get('auth_session');
        // based on given http method execute
        switch(method){
            case HttpMethod.GET:
                return this.http.get<T>(`${API_BASE}/${url}`, {responseType: responseType as "json", headers: headers});
            case HttpMethod.POST:
                return this.http.post<T>(`${API_BASE}/${url}`, params, {responseType: responseType as "json", headers: headers});
            case HttpMethod.DELETE:
                return this.http.delete<T>(`${API_BASE}/${url}`, {responseType: responseType as "json", headers: headers, body: params});
            case HttpMethod.PUT:
                return this.http.put<T>(`${API_BASE}/${url}`, params, {responseType: responseType as "json", headers: headers});
            case HttpMethod.PATCH:
                return this.http.patch<T>(`${API_BASE}/${url}`, params, {responseType: responseType as "json", headers: headers});
            default:
                return this.http.get<T>(``,{responseType: responseType as "json", headers: headers});
        }
    }
}

export enum HttpMethod{
    GET,
    POST,
    DELETE,
    PUT,
    PATCH
}