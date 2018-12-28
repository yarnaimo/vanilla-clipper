import { Field, ModelBase } from '@yarnaimo/rain'
import { IsInstance, IsNumber, IsString, ValidateNested } from 'class-validator'
import { FieldLuxon } from '../field/Luxon'

export interface IMetadata {
    _version: number
    domain: string
    hostname: string
    url: string
    title: string
}

export class VMetadata extends ModelBase<IMetadata> implements IMetadata {
    static async parse(text: string) {
        const vMetadata = new VMetadata()
        vMetadata.set(JSON.parse(text))

        await vMetadata.validate()
        return vMetadata
    }

    @Field(FieldLuxon)
    @IsInstance(FieldLuxon)
    @ValidateNested()
    _createdAt: FieldLuxon = new FieldLuxon().set(new Date())

    @Field @IsNumber() _version = 1

    @Field @IsString() domain!: string
    @Field @IsString() hostname!: string
    @Field @IsString() url!: string
    @Field @IsString() title!: string

    stringify() {
        return JSON.stringify(this.docData, undefined, 4)
    }
}
