async function validatePromocode() {
  // Get the promocode input value
  const promocode = document.getElementById("promocode").value;

  try {
    // Send the promocode to your backend
    const response = await fetch(
      "https://two-step-form.netlify.app/validate-promocode",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: promocode }),
      },
    );

    const result = await response.json();

    // Display the result
    const resultElement = document.getElementById("result");
    if (result.available) {
      resultElement.textContent = "Promocode is valid!";
      resultElement.style.color = "green";
    } else {
      resultElement.textContent = "Promocode is invalid!";
      resultElement.style.color = "red";
    }
  } catch (error) {
    console.error("Error validating promocode:", error);
  }
}

// Add event listener to the button
document
  .getElementById("promocode")
  .addEventListener("input", validatePromocode);
