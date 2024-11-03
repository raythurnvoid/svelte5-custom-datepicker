<script lang="ts" module>
	export interface DatepickerProps {
		min?: Date;
		max?: Date;
		value?: Date | null;
		textValue?: string;
	}
</script>

<script lang="ts">
	import { tick } from 'svelte';

	let {
		min: minProp = new Date(1900, 0, 1),
		max: maxProp = new Date(2999, 11, 31),
		value: valueProp = null
	}: DatepickerProps = $props();

	let input: HTMLInputElement;
	let dialog: HTMLDialogElement;
	let calendar: HTMLDivElement;

	let value = $state(valueProp ? dateToHtmlAttrString(valueProp) : null);
	$effect(() => {
		value = valueProp ? dateToHtmlAttrString(valueProp) : null;
	});

	let pickerValue = $state(valueProp ?? new Date());

	let min = $derived(dateToHtmlAttrString(minProp));
	let max = $derived(dateToHtmlAttrString(maxProp));

	// Add a flag to track how the dialog is being closed
	let shouldRestoreFocus = $state(false);

	function dateToHtmlAttrString(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	function getMonthName(date: Date): string {
		return date.toLocaleString('default', { month: 'long' });
	}

	function createCalendarMatrix(date: Date): Date[][] {
		const dateMonth = date.getMonth();
		const dateYear = date.getFullYear();

		const calendar: Date[][] = [];

		// Get the first day of the month
		const firstDay = new Date(dateYear, dateMonth, 1);
		// Get the last day of the month
		const lastDay = new Date(dateYear, dateMonth + 1, 0);

		// Get Monday before the first day of the month
		let currentDay = new Date(firstDay);
		// JS uses 0 (Sunday) to 6 (Saturday), we want 1 (Monday) to 0 (Sunday)
		const firstDayWeekday = firstDay.getDay() || 7;
		currentDay.setDate(firstDay.getDate() - (firstDayWeekday - 1));

		// Create calendar weeks until we've included the last day of the month
		while (currentDay <= lastDay || calendar[calendar.length - 1]?.length < 7) {
			// Start a new week
			if (calendar.length === 0 || calendar[calendar.length - 1].length === 7) {
				calendar.push([]);
			}

			// Add the current day to the current week
			calendar[calendar.length - 1].push(new Date(currentDay));

			// Move to next day
			currentDay.setDate(currentDay.getDate() + 1);
		}

		return calendar;
	}

	function handleInput() {
		value = input.value;
		valueProp = input.valueAsDate;
		pickerValue = valueProp ?? new Date();
	}

	function handleInputBlur() {
		const inputDate = input.valueAsDate;

		if (!inputDate) {
			value = null;
			valueProp = null;
			pickerValue = new Date();
			return;
		}

		// Check if date is out of bounds
		const minDate = new Date(minProp);
		const maxDate = new Date(maxProp);

		let newDate = inputDate;

		if (inputDate < minDate) {
			newDate = minDate;
		} else if (inputDate > maxDate) {
			newDate = maxDate;
		}

		// Update all values
		value = dateToHtmlAttrString(newDate);
		valueProp = newDate;
		pickerValue = newDate;
	}

	function handleInputKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' && event.altKey) {
			event.preventDefault();
			dialog.showModal();
		}
	}

	function handlePickerButtonClick() {
		dialog.returnValue = '';
		dialog.showModal();
	}

	function handleDialogPointerDown(event: PointerEvent) {
		if (event.target === dialog) {
			shouldRestoreFocus = false;
			dialog.close('click_outside');
		}
	}

	function handleDayClick(day: Date) {
		value = dateToHtmlAttrString(day);
		valueProp = day;
		pickerValue = day;
		shouldRestoreFocus = true;
		dialog.close('select');
	}

	async function handleCalendarGridKeydown(event: KeyboardEvent) {
		const key = event.key;

		// Prevent default behavior for arrow keys to avoid scrolling
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
			event.preventDefault();
		}

		const newDate = new Date(pickerValue);

		switch (key) {
			case 'ArrowLeft':
				newDate.setDate(pickerValue.getDate() - 1);
				break;
			case 'ArrowRight':
				newDate.setDate(pickerValue.getDate() + 1);
				break;
			case 'ArrowUp':
				newDate.setDate(pickerValue.getDate() - 7);
				break;
			case 'ArrowDown':
				newDate.setDate(pickerValue.getDate() + 7);
				break;
			default:
				return;
		}

		// Update the picker value
		pickerValue = newDate;

		// Wait for the DOM to update
		await tick();

		// Focus the new active day button
		const activeButton = calendar.querySelector(
			`.Datepicker--dialog--calendar--day[tabindex="0"]`
		) as HTMLButtonElement;
		activeButton?.focus();
	}

	function handleDialogClose() {
		// If dialog was closed with Escape key or after date selection
		if (shouldRestoreFocus || !dialog.returnValue) {
			input.focus();
		}
		shouldRestoreFocus = false;
	}

	function handlePrevMonthClick() {
		const newDate = new Date(pickerValue);
		newDate.setMonth(pickerValue.getMonth() - 1);
		pickerValue = newDate;
	}

	function handleNextMonthClick() {
		const newDate = new Date(pickerValue);
		newDate.setMonth(pickerValue.getMonth() + 1);
		pickerValue = newDate;
	}
</script>

<div class="Datepicker">
	<div class="Datepicker--input_container">
		<input
			bind:this={input}
			class="Datepicker--input"
			type="date"
			{min}
			{max}
			bind:value
			placeholder="MM/DD/YYYY"
			oninput={handleInput}
			onblur={handleInputBlur}
			onkeydown={handleInputKeydown}
		/>
		<button class="Datepicker--picker_button" tabindex="-1" onclick={handlePickerButtonClick}>
			📅
		</button>
	</div>
	<dialog
		bind:this={dialog}
		class="Datepicker--dialog"
		onpointerdown={handleDialogPointerDown}
		onclose={handleDialogClose}
	>
		<div class="Datepicker--dialog--content">
			<header>
				<button
					class="Datepicker--dialog--prev"
					onclick={handlePrevMonthClick}
					aria-label="Previous month">&lt;</button
				>
				<span>{getMonthName(pickerValue)} {pickerValue.getFullYear()}</span>
				<button
					class="Datepicker--dialog--next"
					onclick={handleNextMonthClick}
					aria-label="Next month">&gt;</button
				>
			</header>
			<div
				bind:this={calendar}
				class="Datepicker--dialog--calendar"
				role="grid"
				tabindex="-1"
				onkeydown={handleCalendarGridKeydown}
			>
				{#each createCalendarMatrix(pickerValue) as week}
					<div class="Datepicker--dialog--calendar--week" role="row">
						{#each week as day}
							<button
								class="Datepicker--dialog--calendar--day"
								class:Datepicker--dialog--calendar--day_other_month={day.getMonth() !==
									pickerValue.getMonth()}
								role="gridcell"
								tabindex={day.toDateString() === pickerValue.toDateString() ? 0 : -1}
								onclick={() => handleDayClick(day)}
							>
								{day.getDate()}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</dialog>
</div>

<style>
	.Datepicker--input_container {
		display: inline-grid;
	}

	.Datepicker--input {
		grid-area: 1 / 1;

		appearance: none;
		padding: 2px 36px 2px 12px;

		anchor-name: --input;

		&:hover {
			cursor: text;
		}

		&::-webkit-calendar-picker-indicator {
			display: none;
		}
	}

	.Datepicker--picker_button {
		all: unset;
		appearance: none;

		grid-area: 1 / 1;

		justify-self: end;

		margin-right: 4px;
	}

	.Datepicker--dialog {
		inset: unset;
		padding: 0;

		position-anchor: --input;

		position: fixed;
		left: anchor(left);
		top: calc(anchor(bottom) + 4px);

		button {
			user-select: none;
		}

		&::backdrop {
			background: transparent;
		}
	}

	.Datepicker--dialog--content {
		padding: 12px;
	}

	.Datepicker--dialog--calendar {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.Datepicker--dialog--calendar--week {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		gap: 4px;
	}

	.Datepicker--dialog--calendar--day {
		all: unset;
		padding: 8px;
		text-align: center;
		cursor: pointer;
		border-radius: 4px;

		&:hover {
			background-color: #f0f0f0;
		}

		&:focus-visible {
			outline: 2px solid blue;
			outline-offset: -2px;
		}
	}

	.Datepicker--dialog--calendar--day_other_month {
		color: lightgrey;
	}

	.Datepicker--dialog header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.Datepicker--dialog--prev,
	.Datepicker--dialog--next {
		all: unset;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;

		&:hover {
			background-color: #f0f0f0;
		}

		&:focus-visible {
			outline: 2px solid blue;
			outline-offset: -2px;
		}
	}
</style>
