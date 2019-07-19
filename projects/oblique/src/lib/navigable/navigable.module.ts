import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material';

import {NavigableDirective} from './navigable.directive';
import {NavigableGroupComponent} from './navigable-group.component';

export {NavigableDirective, NavigableOnChangeEvent, NavigableOnMoveEvent, PreventableEvent} from './navigable.directive';
export {NavigableGroupComponent} from './navigable-group.component';

@NgModule({
	imports: [
		CommonModule
	],
	declarations: [NavigableDirective, NavigableGroupComponent],
	providers: [{provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}],
	exports: [NavigableDirective, NavigableGroupComponent]
})
export class NavigableModule {
}