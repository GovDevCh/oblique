import {AfterViewInit, Directive, ElementRef, HostBinding, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {MasterLayoutHeaderService} from './master-layout-header.service';

@Directive({
	selector: '[orMasterLayoutHeader]',
	exportAs: 'orMasterLayoutHeader'
})
export class MasterLayoutHeaderDirective implements AfterViewInit {

	static OPEN_CLASS = 'header-open';

	@HostBinding('class.application-header-md')
	private headerMD = false;

	private body: HTMLBodyElement;

	constructor(
		private headerService: MasterLayoutHeaderService,
		private elementRef: ElementRef,
		@Inject(DOCUMENT) private document: any) {

		this.body = this.document.querySelector('body');
		this.headerService.medium = this.elementRef.nativeElement.classList.contains('application-header-md');

		// Subscribe to header changes:
		this.headerService.openChange.subscribe((open) => {
			if (open) {
				this.body.classList.add(MasterLayoutHeaderDirective.OPEN_CLASS);
			} else {
				this.body.classList.remove(MasterLayoutHeaderDirective.OPEN_CLASS);
			}
		});
		this.headerService.variantChange.subscribe((headerMD) => {
			this.headerMD = headerMD;
		});
	}

	ngAfterViewInit() {
		// TODO: implement this using a MasterLayoutHeaderToggler instead
		// console.log('ngAfterViewInit', this.elementRef.nativeElement
		// 	.querySelector('[data-toggle="header"]'));
		this.elementRef.nativeElement
			.querySelector('[data-toggle="header"]')
			.addEventListener('click', this.toggle.bind(this));
	}

	toggle() {
		if (this.body.classList.contains(MasterLayoutHeaderDirective.OPEN_CLASS)) {
			this.close();
		} else {
			this.open();
		}
	}

	open() {
		this.headerService.open = true;
	}

	close() {
		this.headerService.open = false;
	}

}