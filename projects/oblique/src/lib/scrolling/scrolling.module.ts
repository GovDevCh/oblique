import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {STEPPER_GLOBAL_OPTIONS} from '@angular/cdk/stepper';
import {TranslateModule} from '@ngx-translate/core';

import {TopControlComponent} from './top-control.component';
import {TelemetryService} from '../telemetry/telemetry.service';
import {requireAndRecordTelemetry} from '../telemetry/telemetry-require';
import {WINDOW, windowProvider} from '../utilities';

export {TopControlComponent} from './top-control.component';
export {ScrollingEvents} from './scrolling-events';

@NgModule({
	imports: [
		CommonModule,
		TranslateModule
	],
	declarations: [TopControlComponent],
	providers: [
		{provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}},
		{provide: STEPPER_GLOBAL_OPTIONS, useValue: { displayDefaultIndicatorType: false }},
		{provide: WINDOW, useFactory: windowProvider}
	],
	exports: [TopControlComponent]
})
export class ScrollingModule {
	constructor(telemetry: TelemetryService) {
		requireAndRecordTelemetry(telemetry, ScrollingModule);
	}
}
