/**
 * Copyright (c) 2015 NAVER Corp.
 * egjs projects are licensed under the MIT license
 */
import * as consts from "./consts";

export default superclass => class extends superclass {
	/**
	 * 'hold' event handler
	 * @private
	 */
	_holdHandler(e) {
		const conf = this._conf;
		const touch = conf.touch;
		const holdPos = e.pos.flick;

		touch.holdPos = holdPos;
		touch.holding = true;
		touch.isTrusted = true;
		conf.panel.changed = false;

		this._adjustContainerCss("start", holdPos);
	}

	/**
	 * 'change' event handler
	 * @private
	 */
	_changeHandler(e) {
		const conf = this._conf;
		const touch = conf.touch;
		const pos = e.pos.flick;
		const holdPos = touch.holdPos;
		let direction;
		let eventRes = null;
		let movedPx;

		this._setPointerEvents(e);  // for "click" bug

		/**
		 * An event that occurs whenever the panel's coordinate value changes. It occurs in the following cases.<br><br>1. When the user is inputing the move.<br>2. When moving to the destination panel after you have finished inputing the move in step 1.<br>3. When the current panel is moving to its original position after the movement is finished in step 1.<br>4. Moving to the destination panel by calling the `moveTo()`, `prev()`, `next()`  method. (Do not prevent the default behavior of the [beforeFlickStart]{@link eg.Flicking#event:beforeFlickStart} event.)
		 * @ko 패널의 좌표값이 변할 때마다 발생하는 이벤트. 아래의 경우에 발생한다.<br><br>1. 사용자가 이동(move) 액션 입력중일 때.<br>2. 1번에서 이동(move) 액션 입력이 끝나고 목적 패널로 이동중일 때.<br>3. 1번에서 이동(move) 액션 입력이 끝나고 현재 패널의 원래 위치로 이동중일 때.<br>4. `moveTo()`, `prev()`, `next()`, 메서드를 호출하여 목적 패널로 이동중일 때. ([beforeFlickStart]{@link eg.Flicking#event:beforeFlickStart}이벤트의 기본동작을 막지 않아야 한다.)<br>5. `restore()` 메서드를 호출하여 현재 패널이 원래 위치로 이동중일 때. ([beforeFlickStart]{@link eg.Flicking#event:beforeFlickStart}이벤트의 기본동작 방지 전제.)
		 * @name eg.Flicking#flick
		 * @event
		 * @property {String} eventType The name of the event<ko>이벤트 명</ko>
		 * @property {Boolean} isTrusted true when the event was generated by a user action(`"mouse"` or `"touch"`) otherwise false<ko>사용자 액션(`"mouse"` 또는 `"touch"`)에 의해 이벤트가 생성된 경우 `true`. 그 외는 `false`</ko>
		 * @property {Number} index Physical index number of the current panel element. See the [getIndex()]{@link eg.Flicking#getIndex} method. (@deprecated since 1.3.0)<ko>현재 패널 요소의 물리적 인덱스 번호. [getIndex()]{@link eg.Flicking#getIndex}메서드 참조. (@deprecated since 1.3.0)</ko>
		 * @property {Number} no Logical index number of the current panel element. See the [getIndex()]{@link eg.Flicking#getIndex} method.<ko>현재 패널 요소의 논리적 인덱스 번호. [getIndex()]{@link eg.Flicking#getIndex}메서드 참조.</ko>
		 * @property {Number} direction of the panel movement. If `horizontal=true` is {@link eg.Flicking.DIRECTION_LEFT} or {@link eg.Flicking.DIRECTION_RIGHT}. If `horizontal=false` is {@link eg.Flicking.DIRECTION_UP} or {@link eg.Flicking.DIRECTION_DOWN}.<ko>패널 이동 방향. `horizontal=true` 이면 {@link eg.Flicking.DIRECTION_LEFT} 혹은 {@link eg.Flicking.DIRECTION_RIGHT}. `horizontal=false` 이면 {@link eg.Flicking.DIRECTION_UP} 혹은 {@link eg.Flicking.DIRECTION_DOWN}.</ko>
		 * @property {Number} pos current coordinate <ko>현재 좌표.</ko>
		 * @property {Boolean} holding Whether the user is inputing through the input device. (Whether it is 'mousedown' for a mouse device or 'touchmove' for a touch device.)<ko>사용자가 입력 장치를 통해 입력중인지 여부. (마우스 장치라면 'mousedown' 여부, 터치 장치라면 'touchmove' 여부)</ko>
		 * @property {Number} distance Distance value from the touch starting point. If the `direction` property value is {@link eg.Flicking.DIRECTION_LEFT} or {@link eg.Flicking.DIRECTION_UP}, it returns a positive number. {@link eg.Flicking.DIRECTION_RIGHT} or {@link eg.Flicking.DIRECTION_DOWN} returns a negative value.<ko>터치 시작점으로부터 이동한 거리 값. `direction`속성값이 {@link eg.Flicking.DIRECTION_LEFT} 혹은 {@link eg.Flicking.DIRECTION_UP}이면 양수를, {@link eg.Flicking.DIRECTION_RIGHT} 혹은 {@link eg.Flicking.DIRECTION_DOWN}이면 음수를 반환한다.</ko>
		 * @see eg.Flicking#event:beforeRestore
		 * @see eg.Flicking#restore
		 * @see eg.Flicking#event:beforeFlickStart
		 * @see eg.Flicking#event:flickEnd
		 * @see eg.Flicking#moveTo
		 * @see eg.Flicking#prev
		 * @see eg.Flicking#next
		 * @example
			 * The order of event occurrence.
			 * 이벤트 발생 순서
			 * ```javascript
			 * // When moving to the destination panel.
			 * // 목적 패널로 이동할 때.
			 * beforeFlickStart (once) > flick (many times) > flickEnd (once)
			 *
			 * // When the restore operation.
			 * // 복원 동작일 때.
			 * beforeRestore (once) > flick (many times) > restore (once)
			 * ```
		 */
		if (e.inputEvent) {
			direction = e.inputEvent.direction;

			// Adjust direction in case of diagonal touch move
			movedPx = e.inputEvent[this.options.horizontal ? "deltaX" : "deltaY"];

			if (!~conf.dirData.indexOf(direction)) {
				direction = conf.dirData[+(Math.abs(touch.lastPos) <= movedPx)];
			}

			touch.lastPos = movedPx;
		} else {
			touch.lastPos = null;
		}

		conf.customEvent.flick && (eventRes =
			this._triggerEvent(consts.EVENTS.flick, {
				pos,
				holding: e.holding,
				direction: direction || touch.direction,
				distance: pos - holdPos
			})
		);

		(eventRes || eventRes === null) && this._setTranslate([-pos, 0]);
	}

	/**
	 * 'release' event handler
	 * @private
	 */
	_releaseHandler(e) {
		const conf = this._conf;
		const touch = conf.touch;
		const holdPos = touch.holdPos;
		const panelSize = conf.panel.size;
		const customEvent = conf.customEvent;
		const isPlusMove = touch.holdPos < e.depaPos.flick;

		touch.distance = e.depaPos.flick - holdPos;
		touch.direction = conf.dirData[+!(isPlusMove)];
		touch.destPos = holdPos + (isPlusMove ? panelSize : -panelSize);

		const distance = touch.distance;
		let duration = this.options.duration;
		let moveTo = holdPos;

		if (this._isMovable()) {
			!customEvent.restoreCall && (customEvent.restore = false);
			moveTo = touch.destPos;
		} else if (Math.abs(distance) > 0) {
			this._triggerBeforeRestore(e);
		} else {
			duration = 0;
		}

		// trigger animation
		e.setTo({flick: moveTo}, duration);

		distance === 0 && this._adjustContainerCss("end");
		touch.holding = false;

		this._setPointerEvents();  // for "click" bug
	}

	/**
	 * 'animationStart' event handler
	 * @private
	 */
	_animationStartHandler(e) {
		const conf = this._conf;
		const panel = conf.panel;
		const customEvent = conf.customEvent;
		const isFromInput = e.inputEvent || conf.touch.lastPos;

		// when animation was started by input action
		if (!customEvent.restoreCall && isFromInput &&
			this._setPhaseValue("start", {
				depaPos: e.depaPos.flick,
				destPos: e.destPos.flick
			}) === false) {
			e.stop();
		}

		if (isFromInput) {
			e.duration = this.options.duration;

			e.destPos.flick =
				panel.size * (
					panel.index + conf.indexToMove
				);
		}

		panel.animating = true;
	}

	/**
	 * 'animationEnd' event handler
	 * @private
	 */
	_animationEndHandler() {
		const conf = this._conf;

		conf.panel.animating = false;

		this._setPhaseValue("end");
		this._triggerRestore();

		// reset isTrusted
		conf.touch.isTrusted = false;
	}
};
