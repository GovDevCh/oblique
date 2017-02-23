import {
    Directive, Input, ElementRef, HostBinding, Output, EventEmitter,
    HostListener, AfterViewInit
} from '@angular/core';

/**
 * NavigableDirective
 *
 * api:
 *      [navigable]:any                         The data, that should be selected
 *      [navigableInitialActivated]:boolean              Should this item be activated initially?
 *      (navigableOnMove):NavigableOnMoveEvent  Emits if up or down key is pressed
 *      (navigableOnMouseDown):MouseEvent       Emits if item is clicked
 *      (navigableOnFocus):FocusEvent           Emits if item is focused
 *      (navigableOnActivation):void            Emits if item is activated
 *
 */
@Directive({
    selector: '[navigable]'
})
export class NavigableDirective implements AfterViewInit {

    private static ARROWS = {
        UP: 38,
        DOWN: 40
    };

    @Input('navigable') model: any;

    @Input() navigableInitialActivated: boolean;

    @Output() navigableOnMove = new EventEmitter();

    @Output() navigableOnMouseDown = new EventEmitter();

    @Output() navigableOnFocus = new EventEmitter();

    @HostBinding('class.navigable') navigableClass = true;

    //TODO: needed? If yes, how to implement? (implementation in 1.3.0 seems to be broken)
    @HostBinding('class.navigable-highlight') highlighted = false;

    @HostBinding('class.navigable-selected') selected = false;

    @HostBinding('tabindex') tabindex = 0;

    @Output() navigableOnActivation = new EventEmitter();

    @HostBinding('class.navigable-active')
    get activated() {
        return this.activatedValue;
    }

    set activated(val: boolean) {
        this.activatedValue = val;
        if (val) {
            this.navigableOnActivation.emit();
        }
    }

    private activatedValue = false;

    constructor(private el: ElementRef) {
        //TODO: use renderer?
    }

    ngAfterViewInit(): void {
        //This makes sure, that parent components are able to subscribe to the navigableOnFocus before onFocus is triggered
        setTimeout(() => {
            if (this.navigableInitialActivated) {
                this.focus();
            }
        }, 0);
    }

    //TODO: discuss if this should completely moved to parent
    @HostListener('keydown', ['$event']) onKeyDown($event: KeyboardEvent) {
        let keyCode = $event.keyCode;
        if (keyCode === NavigableDirective.ARROWS.UP || keyCode === NavigableDirective.ARROWS.DOWN) {
            let focused = this.el.nativeElement.querySelector(':focus');
            //TODO: Implement parent check, if ng-bootstrap is integrated!
            if (!focused || !focused.classList.contains('dropdown-toggle') /*&& (focused.parents('.dropdown-menu').length === 0)*/) {
                $event.preventDefault();
                if ($event.ctrlKey && $event.shiftKey) {
                    //TODO: what do we do here?
                    /*scope.$apply(() => {
                     navigable.navigableOnMove(event, navigable.model, keyCode === arrows.up);
                     });*/
                } else {
                    this.navigableOnMove.emit(new NavigableOnMoveEvent(keyCode, $event.ctrlKey || $event.shiftKey));
                    /*navigable.handleChildMove(keyCode, event.ctrlKey || event.shiftKey);*/
                }
            }
        }
    }

    @HostListener('mousedown', ['$event']) onMouseDown($event: MouseEvent) {
        this.navigableOnMouseDown.emit($event);
        //TODO: handle the canFocus case -> see 1.3.0
    }

    @HostListener('focus', ['$event']) onFocus($event: FocusEvent) {
        this.navigableOnFocus.emit($event);
    }

    public focus() {
        this.el.nativeElement.focus();
    }
}

export class NavigableOnMoveEvent {
    constructor(public keyCode: number, public combine: boolean) {

    }
}