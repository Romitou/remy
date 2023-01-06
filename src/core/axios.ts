import axios, { AxiosInstance } from 'axios';

let axiosClient: AxiosInstance;

export function createAxiosClient() {
    axiosClient = axios.create({
        baseURL: process.env.BASE_API,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`,
            'Accept-Encoding': 'gzip,deflate,compress',
        },
    });
}

export function getAxiosClient(): AxiosInstance {
    return axiosClient;
}
