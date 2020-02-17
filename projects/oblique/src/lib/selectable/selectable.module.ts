import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {SelectableDirective} from './selectable.directive';
import {TelemetryService} from '../telemetry/telemetry.service';
import {requireAndRecordTelemetry} from '../telemetry/telemetry-require';
import {WINDOW, windowProvider} from '../utilities';

export {ObSelectableService} from './selectable.service';
export {SelectableDirective as ObSelectableDirective} from './selectable.directive';

@NgModule({
	imports: [CommonModule],
	declarations: [SelectableDirective],
	providers: [
		{provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}},
		{provide: WINDOW, useFactory: windowProvider}
	],
	exports: [SelectableDirective]
})
export class ObSelectableModule {
	constructor(telemetry: TelemetryService) {
		requireAndRecordTelemetry(telemetry, ObSelectableModule);
	}
}