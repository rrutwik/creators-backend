import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class SendOTPDto {
    @IsString()
    @IsNotEmpty()
    phone: string;
}

export class VerifyOTPDto {
    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    otp: string;
}
