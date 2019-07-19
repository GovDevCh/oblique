import {AfterViewInit, Directive, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output} from '@angular/core';

export class PreventableEvent {
	public prevented = false;
}

export class NavigableOnChangeEvent extends PreventableEvent {
	constructor(public code: string, public combine: boolean) {
		super();
	}
}

export class NavigableOnMoveEvent extends PreventableEvent {
	constructor(public code: string) {
		super();
	}
}

/**
 * NavigableDirective
 *
 * API:
 * - [orNavigable]:any                           The data model of the current navigable item.
 * - [navigableActivate]:boolean                 Activates current item if `true`.
 * - [navigableFocusOnInit]:boolean              Defines if the current item should be focused on directive initialisation.
 * - [navigableHighlight]:boolean                Highlights current item if `true`.
 * - (navigableOnActivation):void                Emits if the navigable item is activated.
 * - (navigableOnChange):NavigableOnChangeEvent  Emits if UP or DOWN key is pressed, while the navigable item is focused.
 * - (navigableOnFocus):FocusEvent               Emits if the navigable item is focused.
 * - (navigableOnMouseDown):MouseEvent           Emits if the navigable item is clicked/tapped.
 * - (navigableOnMove):FocusEvent                Emits if the navigable item is moved (with SHIFT+CTRL+[UP|DOWN]).
 */
@Directive({
	selector: '[orNavigable]',
	exportAs: 'orNavigable'
})
export class NavigableDirective implements AfterViewInit {

	@Input('orNavigable')
	model: any;

	@Input('navigableFocusOnInit')
	focusOnInit: boolean;

	@Output()
	navigableOnActivation = new EventEmitter();

	@Output()
	navigableOnChange = new EventEmitter<NavigableOnChangeEvent>();

	@Output()
	navigableOnFocus = new EventEmitter();

	@Output()
	navigableOnMouseDown = new EventEmitter();

	@Output()
	navigableOnMove = new EventEmitter();

	@HostBinding('tabindex')
	tabindex = 0;

	@HostBinding('class.navigable')
	navigableClass = true;

	@HostBinding('class.navigable-selected')
	selected = false;

	@Input('navigableHighlight')
	@HostBinding('class.navigable-highlight')
	highlight = false;

	@Input('navigableActivate')
	set activate(value: boolean) {
		setTimeout(() => {
			this.active = value;
		});
	}

	@HostBinding('class.navigable-active')
	get active() {
		return this.activatedValue;
	}

	set active(value: boolean) {
		this.activatedValue = value;
		if (value) {
			this.selected = true;
			this.navigableOnActivation.emit();
		}
	}

	private activatedValue = false;

	constructor(private readonly element: ElementRef) {
	}

	ngAfterViewInit(): void {
		// This makes sure, that parent components are able to
		// subscribe to focus events before it gets triggered on init:
		setTimeout(() => {
			if (this.focusOnInit) {
				this.focus();
			}
		}, 0);
	}

	@HostListener('keydown', ['$event'])
	onKeyDown($event: KeyboardEvent) {
		const code = $event.code;
		if (code === 'ArrowUp' || code === 'ArrowDown') {
			const focused = this.element.nativeElement.querySelector(':focus');
			if (!focused || !focused.classList.contains('dropdown-toggle')
				&& !NavigableDirective.hasAncestorClass(focused, 'dropdown-menu')) {
				$event.preventDefault();

				if ($event.ctrlKey && $event.shiftKey) {
					this.navigableOnMove.emit(new NavigableOnMoveEvent(code));

					// Try to restore focus:
					setTimeout(() => {
						(focused || this).focus();
					}, 0);
				} else {
					this.navigableOnChange.emit(new NavigableOnChangeEvent(code, $event.ctrlKey || $event.shiftKey));
				}
			}
		}
	}

	/**
	 * Using `mousedown` instead of `click` event
	 * to ensure it is triggered before focus event!
	 *
	 * Note: `focus` events do not propagate keyboard modifiers (CTRL, SHIFT, etc.)
	 */
	@HostListener('mousedown', ['$event'])
	onMouseDown($event: MouseEvent) {
		// Notify listeners:
		this.navigableOnMouseDown.emit($event);

		// Check that event does not originate from a focusable child element:
		const target = $event.target || $event.currentTarget;
		if (target === this.element.nativeElement || !NavigableDirective.isFocusable(target)) {
			if (!$event.defaultPrevented) {
				if ($event && $event.shiftKey) {
					this.active = true;
					$event.preventDefault(); // This prevents text selection as we are holding the SHIFT key...
					this.focus();            // ...but then focus needs to be manually restored.
				} else if ($event && $event.ctrlKey && this.selected) {
					$event.preventDefault(); // Ensure focus event is not triggered!
					this.active = false;
					this.selected = false;
				} else {
					this.active = true;
				}
			}
		} else {
			// Focus landed on a child element of current item but let's ensure it gets active:
			this.active = true;
		}
	}

	@HostListener('focus', ['$event'])
	onFocus($event: FocusEvent) {
		this.navigableOnFocus.emit($event);

		if (!$event.defaultPrevented && !this.active) {
			this.active = true;
		}
	}

	public focus() {
		this.element.nativeElement.focus();
	}

	public moveUp() {
		this.navigableOnMove.emit(new NavigableOnMoveEvent('ArrowUp'));
	}

	public moveDown() {
		this.navigableOnMove.emit(new NavigableOnMoveEvent('ArrowDown'));
	}

	private static hasAncestorClass(element: Element, className: string): boolean {
		while (element && element.parentElement) {
			element = element.parentElement;
			if (element.classList.contains(className)) {
				return true;
			}
		}
		return false;
	}

	private static getAncestorElement(element: Element, nodeName: string): Element {
		while (element && element.parentElement) {
			element = element.parentElement;
			if (element.nodeName.toLowerCase() === nodeName) {
				return element;
			}
		}
		return undefined;
	}

	private static isFocusable(element): boolean {
		const nodeName = element.nodeName.toLowerCase();
		if (!element.offsetHeight || !element.offsetWidth || element.hasAttribute('disabled')
			|| NavigableDirective.isWithinDisabledFieldset(element, nodeName)) {
			return false;
		}

		return (nodeName === 'a' && element.href) || element.hasAttribute('tabindex');
	}

	private static isWithinDisabledFieldset(element: Element, nodeName: string): boolean {
		if (!/^(input|select|textarea|button|object)$/.test(nodeName)) {
			return false;
		}

		const fieldset = NavigableDirective.getAncestorElement(element, 'fieldset');
		return fieldset && fieldset.hasAttribute('disabled');
	}
}
