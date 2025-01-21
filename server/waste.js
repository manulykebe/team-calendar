////////////////////////////////////////////////////////
// 1) Wait for the H4 that contains "Examenaanbod: BBB"
////////////////////////////////////////////////////////
// const queryString = "Vrij zwemmen";
const queryString = "Power Yoga";

const poller = function (queryString) {
	// Poll for the H4 that contains the query string
	var checkIntervalH4 = setInterval(function () {
		console.log("x");
		var $targetH4 = $(`h4:contains(${queryString})`);

		// Found the H4?
		if ($targetH4.length) {
			$targetH4 = $targetH4.last(); // Get the last one
			clearInterval(checkIntervalH4); // Stop searching for the H4

			///////////////////////////////////////////////////////////////
			// 2) Check if this slot is already disabled (booked, etc.).
			//    We look up to its parent (p-3, border-bottom, etc.) which
			//    may have "opacity-50 disabled" and pointer-events: none.
			///////////////////////////////////////////////////////////////
			var $slotContainer = $targetH4.closest(".p-3.border-bottom");
			var isDisabled =
				$slotContainer.hasClass("opacity-50") ||
				$slotContainer.hasClass("disabled") ||
				$slotContainer.css("pointer-events") === "none";

			if (isDisabled) {
				console.log(
					`Slot for ${queryString} is already booked or disabled. Skipping …`
				);
				return; // Exit. Nothing more to do.
			}

			// If not disabled, click on the H4 to open the modal.
			console.log(`Clicking H4 for ${queryString}…`);
			$targetH4.click();

			//////////////////////////////////////////////////////////
			// 3) Now poll for the modal’s details-book-button
			//////////////////////////////////////////////////////////
			var checkIntervalBtn = setInterval(function () {
				var $modalButton = $(
					'button[data-test-id="details-book-button"]'
				);
				if ($modalButton.length) {
					if ($modalButton.hasClass("disabled")) {
						console.log("Slot cannot be booked. Exiting…");
						$('button[data-test-id="button-close-modal"]').click();
						clearInterval(checkIntervalBtn);
                        document.title = $('.mb-0.small:not(.mt-0)').text().split('in')[1].trim().replaceAll(' : ',':')
						setTimeout(() => {
							poller(queryString);
						}, 500);
						return;
					} else {
						clearInterval(checkIntervalBtn); // Found the button; stop polling
						console.log("Found modal button, clicking…");
						$modalButton.click();
					}
				}
			}, 500); // End checkIntervalBtn
		}
	}, 500); // End checkIntervalH4
};

$(document).ready(function () {
    console.log('start sportsitcker');
	poller(queryString);
});
