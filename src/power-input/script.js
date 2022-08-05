import React from 'react'
import { createRoot } from 'react-dom/client'
import confetti from 'canvas-confetti'
// import useCaretPosition from 'use-caret-position'

/**
 * use-caret-position
 *
 *
 * */

/**
 * returns x, y coordinates for absolute positioning of a span within a given text input
 * at a given selection point
 * @param {object} input - the input element to obtain coordinates for
 * @param {number} selectionPoint - the selection point for the input
 */
const getCaretPosition = (input, selection = 'selectionStart') => {
	const { scrollLeft, scrollTop } = input
	// This provides a hook for getSelection to reuse getCaretPosition.
	const selectionPoint = input[selection] || input.selectionStart
	const { height, width, left, top } = input.getBoundingClientRect()
	// create a dummy element that will be a clone of our input
	const div = document.createElement('div')
	// get the computed style of the input and clone it onto the dummy element
	const copyStyle = getComputedStyle(input)
	for (const prop of copyStyle) {
		div.style[prop] = copyStyle[prop]
	}
	// we need a character that will replace whitespace when filling our dummy element if it's a single line <input/>
	const swap = '.'
	const inputValue =
		input.tagName === 'INPUT' ? input.value.replace(/ /g, swap) : input.value
	// set the div content to that of the textarea up until selection
	const textContent = inputValue.substr(0, selectionPoint)
	// set the text content of the dummy element div
	div.textContent = textContent
	if (input.tagName === 'TEXTAREA') div.style.height = 'auto'
	// if a single line input then the div needs to be single line and not break out like a text area
	if (input.tagName === 'INPUT') div.style.width = 'auto'
	// Apply absolute positioning to account for textarea resize, etc.
	div.style.position = 'absolute'
	// create a marker element to obtain caret position
	const span = document.createElement('span')
	// give the span the textContent of remaining content so that the recreated dummy element is as close as possible
	span.textContent = inputValue.substr(selectionPoint) || '.'
	// append the span marker to the div
	div.appendChild(span)
	// append the dummy element to the body
	document.body.appendChild(div)
	// get the marker position, this is the caret position top and left relative to the input
	const { offsetLeft: spanX, offsetTop: spanY } = span
	// lastly, remove that dummy element
	// NOTE:: can comment this out for debugging purposes if you want to see where that span is rendered
	document.body.removeChild(div)
	// return an object with the x and y of the caret. account for input positioning so that you don't need to wrap the input
	let x = left + spanX
	let y = top + spanY
	const { lineHeight, paddingRight } = copyStyle
	x = Math.min(x - scrollLeft, left + width - parseInt(paddingRight, 10))
	// Need to account for any scroll position for the window.
	y =
		Math.min(y - scrollTop, top + height - parseInt(lineHeight, 10)) +
		window.scrollY
	return {
		x,
		y,
	}
}

const getSelectionPosition = (input) => {
	const { y: startY, x: startX } = getCaretPosition(input, 'selectionStart')
	const { x: endX } = getCaretPosition(input, 'selectionEnd')
	// Gives you a basic left position for where to put it and the starting position.
	const x = startX + (endX - startX) / 2
	const y = startY
	return {
		x,
		y,
	}
}

const useCaretPosition = (element) => {
	const [x, setX] = React.useState(null)
	const [y, setY] = React.useState(null)

	const getPosition = (element) => {
		if (element.current) {
			const { x, y } = getCaretPosition(element.current)
			setX(x)
			setY(y)
			return { x, y }
		}
	}

	const getSelection = (element) => {
		if (element.current) {
			const { x, y } = getSelectionPosition(element.current)
			setX(x)
			setY(y)
			return { x, y }
		}
	}

	return { x, y, getPosition, getSelection }
}

// End use-caret-position

const ROOT = createRoot(document.querySelector('#app'))

const mapRange = (inputLower, inputUpper, outputLower, outputUpper) => {
	const INPUT_RANGE = inputUpper - inputLower
	const OUTPUT_RANGE = outputUpper - outputLower
	return (value) =>
		outputLower + (((value - inputLower) / INPUT_RANGE) * OUTPUT_RANGE || 0)
}

const clamp = (min, max, value) => Math.min(Math.max(value, min), max)

const randomInRange = (min, max) =>
	Math.floor(
		Math.random() * (Math.floor(max) - Math.ceil(min) + 1) + Math.ceil(min)
	)

const App = () => {
	const powerInputRef = React.useRef(null)
	const { x, y, getPosition } = useCaretPosition(powerInputRef)

	const resetInput = () => {
		powerInputRef.current.removeEventListener('transitionend', resetInput)
		powerInputRef.current.style.setProperty('--x', 0)
		powerInputRef.current.style.setProperty('--y', 0)
	}

	const blast = pos => {
		powerInputRef.current.style.setProperty('--x', 10)
		powerInputRef.current.style.setProperty('--y', 10)
		confetti({
			origin: {
				x: pos.x / window.innerWidth,
				y: pos.y / window.innerHeight,
			},
			particleCount: randomInRange(10, 50),
			scalar: randomInRange(50, 120) / 100,
			disableForReducedMotion: true,
			gravity: 1,
			drift: 0,
			angle: 90,
			spread: 45,
			startVelocity: randomInRange(5, 25),
			ticks: randomInRange(50, 100),
			colors: ['#e74c2c'],
			zIndex: -1,
		})
		powerInputRef.current.addEventListener('transitionend', resetInput)
		
	}

	const fire = (e) => {
		if (e.type !== 'focus') {
			const pos = getPosition(powerInputRef)
			resetInput()
			requestAnimationFrame(() => blast(pos))
		}
	}

	return (
		<>
			<label htmlFor="coupon">Coupon Code</label>
			<input
				id="coupon"
				ref={powerInputRef}
				type="text"
				onFocus={fire}
				onInput={fire}
			/>
		</>
	)
}

ROOT.render(<App />)
