import {AfterViewInit, Directive, ElementRef, HostBinding, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {takeUntil} from 'rxjs/operators';

import {MasterLayoutHeaderService} from './master-layout-header.service';
import {Unsubscribable} from '../unsubscribe';

/**
 * @deprecated since version 2.1.0. Will be deleted in version 3.0.0. Use MasterLayoutComponent & MasterLayoutService instead
 */
@Directive({
	selector: '[orMasterLayoutHeader]',
	exportAs: 'orMasterLayoutHeader'
})
export class MasterLayoutHeaderDirective extends Unsubscribable implements AfterViewInit {

	static OPEN_CLASS = 'header-open';

	@HostBinding('class.application-header-md')
	private headerMD = false;

	private readonly body: HTMLBodyElement;

	constructor(private readonly headerService: MasterLayoutHeaderService,
				private readonly elementRef: ElementRef,
				@Inject(DOCUMENT) private readonly document: any) {
		super();
		console.warn('MasterLayoutHeaderDirective is deprecated since version 2.1.0 and will be deleted in version 3.0.0. ' +
			'Use MasterLayoutComponent & MasterLayoutService instead');

		this.body = this.document.querySelector('body');
		this.headerService.medium = this.elementRef.nativeElement.classList.contains('application-header-md');

		// Subscribe to header changes:
		this.headerService.openChange
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((open) => {
				if (open) {
					this.body.classList.add(MasterLayoutHeaderDirective.OPEN_CLASS);
				} else {
					this.body.classList.remove(MasterLayoutHeaderDirective.OPEN_CLASS);
				}
			});
		this.headerService.variantChange
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((headerMD) => {
				this.headerMD = headerMD;
			});
	}

	ngAfterViewInit() {
		// TODO: implement this using a MasterLayoutHeaderToggler instead
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