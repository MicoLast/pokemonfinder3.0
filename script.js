document.getElementById("fetchButton").addEventListener("click", fetchData);

async function fetchData() {
    try {
        const pokemonName = document.getElementById("pokemonName").value.toLowerCase();
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

        if (!response.ok) {
            throw new Error("Could not fetch resource");
        }

        const data = await response.json();
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();
        
        displayData(data, speciesData);
        
        // Call shareYawa to send the data to MS Teams
        await shareData(pokemonName); // Pass the Pokémon name here
    } catch (error) {
        console.error(error);
        document.getElementById("result").textContent = "Error: " + error.message;
        document.getElementById("pokemonImage").style.display = "none";
    }
}

function displayData(data, speciesData) {
    const resultElement = document.getElementById("result");
    const flavorTextEntries = speciesData.flavor_text_entries;
    const englishDescription = flavorTextEntries.find(entry => entry.language.name === "en").flavor_text;

    resultElement.innerHTML = `
        <h2>${data.name.charAt(0).toUpperCase() + data.name.slice(1)}</h2>
        <p>${englishDescription}</p>
    `;

    const pokemonImage = document.getElementById("pokemonImage");
    pokemonImage.src = data.sprites.front_default;
    pokemonImage.alt = data.name;
    pokemonImage.style.display = "block";
}

function shareData(pokemonName) {
    const apiUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`;

    //fetch pokemon data
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not fetch resource");
            }
            return response.json();
        })
        .then(data => {
            return fetch(data.species.url).then(speciesResponse => {
                if (!speciesResponse.ok) {
                    throw new Error("Could not fetch species resource");
                }
                return speciesResponse.json().then(speciesData => {
                    //create the json body for msteams
                    const jsonBody = {
                        type: "message",
                        attachments: [
                            {
                                contentType: "application/vnd.microsoft.card.adaptive",
                                contentUrl: null,
                                content: {
                                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                    type: "AdaptiveCard",
                                    version: "1.3",
                                    body: [
                                        {
                                            type: "TextBlock",
                                            text: data.name.charAt(0).toUpperCase() + data.name.slice(1),
                                            weight: "Bolder",
                                            size: "ExtraLarge",
                                            wrap: true,
                                            horizontalAlignment: "Center",
                                            spacing: "Medium"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `Type: ${data.types.map(typeInfo => typeInfo.type.name).join(', ')}`,
                                            wrap: true,
                                            spacing: "Small"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: `Abilities: ${data.abilities.map(abilityInfo => abilityInfo.ability.name).join(', ')}`,
                                            wrap: true,
                                            spacing: "Small"
                                        },
                                        {
                                            type: "Image",
                                            url: data.sprites.front_default,
                                            altText: `${data.name.charAt(0).toUpperCase() + data.name.slice(1)} Thumbnail`,
                                            size: "Auto",
                                            horizontalAlignment: "Center",
                                            spacing: "Medium"
                                        },
                                        {
                                            type: "TextBlock",
                                            text: speciesData.flavor_text_entries.find(entry => entry.language.name === "en").flavor_text,
                                            wrap: true,
                                            spacing: "Small"
                                        }
                                    ],
                                    actions: [
                                        {
                                            type: "Action.OpenUrl",
                                            title: "View Pokémon Info",
                                            url: apiUrl
                                        },
                                        {
                                            type: "Action.OpenUrl",
                                            title: "View Pokémon Website",
                                            url: "https://www.pokemon.com"
                                        }
                                    ]
                                }
                            }
                        ]
                    };

                    //send the json body to msteams
                    const webhookUrl = "https://mseufeduph.webhook.office.com/webhookb2/8ef714f6-81de-4b42-ad2e-c262d5ce04d1@ddedb3cc-596d-482b-8e8c-6cc149a7a7b7/IncomingWebhook/9ef0b875219140eb8135437505a9d31c/e0510d66-17c3-43f4-a3ef-0cf6a6fba189/V24duT1GXj0kuDCkgbXHPSG6tCe2ZunOnaM30gWrZrYuo1";

                    return fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(jsonBody)
                    });
                });
            });
        })
        .then(teamsResponse => {
            if (teamsResponse.ok) {
                console.log("Message sent successfully!");
            } else {
                console.error("Error sending message:", teamsResponse.statusText);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

