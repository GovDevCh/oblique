import {Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output} from '@angular/core';

@Directive({
	selector: '[orTextControlClear]',
	exportAs: 'orTextControlClear'
})
export class TextControlClearDirective {

	@Input('orTextControlClear')
	control: HTMLInputElement;

	@Input()
	focusOnClear = true;

	@Output()
	onClear = new EventEmitter<MouseEvent>();

	@HostBinding('class.text-control-clear')
	cssClass = true;

	constructor(private element: ElementRef) {
		// Ensure parent gets ready to render the text clear control:
		let parent = this.element.nativeElement.parentElement;
		if (parent) {
			parent.classList.add('text-control');
		}
	}

	@HostListener('click', ['$event'])
	onClick($event: MouseEvent) {
		this.control.value = '';
		if (this.focusOnClear) {
			this.control.focus();
		}
		this.onClear.next($event);
	}
}
