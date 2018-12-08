import { FieldBase } from '@yarnaimo/rain'
import { IsInstance } from 'class-validator'
import { DateTime } from 'luxon'

export class FieldLuxon extends FieldBase {
    @IsInstance(DateTime) dateTime!: DateTime

    set(date: Date) {
        this.dateTime = DateTime.fromJSDate(date)
        return this
    }

    value() {
        return this.dateTime.toISO()
    }
}
