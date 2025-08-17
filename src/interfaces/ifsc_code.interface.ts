export interface IFSCCode {
    _id: string;
    ifsc: string;
    bank_code: string;
    bank: string;
    branch: string;
    city: string;
    district: string;
    state: string;
    address: string;
    contact: string;
    micr: string;
    swift: string;
    iso3166: string;
    imps: boolean;
    neft: boolean;
    rtgs: boolean;
    upi: boolean;
    type: string;
}