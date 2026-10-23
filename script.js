const sceneTitle = document.getElementById("scene-title");
const sceneText = document.getElementById("scene-text");
const choicesContainer = document.getElementById("choices-container");
const characterName = document.getElementById("character-name");
const batteryDisplay = document.getElementById("health-display");
const inventoryDisplay = document.getElementById("inventory-display");
const messageDisplay = document.getElementById("message-display");

const maxBattery = 6;
const state = {
  battery: maxBattery,
  inventory: [],
  location: null,
  firstStationVisit: true,
  campsiteVisits: 0,
  visitedCampsite: false,
  visitedShowerHouse: false,
  searchedShowerHouse: false,
  collectedSample: false,
  reportedSample: false,
  reportedShed: false,
  visitedShed: false,
  unlockedShed: false,
  foundBear: false,
  toldCamperAboutBear: false,
  toldCamperAboutSample: false,
  lastCampSearch: "",
  freeNextShowerEntry: false,
  gameOver: false,
  message: ""
};

const sceneLocations = {
  station: "Ranger Station",
  radio: "Ranger Station",
  map: "Ranger Station",
  campsite: "Campsite",
  campTalk: "Campsite",
  campSearch: "Campsite",
  shower: "Shower house",
  showerSearch: "Shower house",
  forest: "Forest",
  shed: "Shed"
};

function updateStatus() {
  batteryDisplay.textContent = String(state.battery);
  inventoryDisplay.replaceChildren();

  if (state.inventory.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "inventory-empty";
    emptyItem.textContent = "Empty";
    inventoryDisplay.appendChild(emptyItem);
    return;
  }

  state.inventory.forEach(function (item) {
    const inventoryItem = document.createElement("li");
    inventoryItem.textContent = item;
    inventoryDisplay.appendChild(inventoryItem);
  });
}

function setMessage(message) {
  state.message = message;
}

function endGame(title, text) {
  state.gameOver = true;
  sceneTitle.textContent = title;
  characterName.textContent = "";
  sceneText.textContent = text;
  choicesContainer.innerHTML = "";
  messageDisplay.textContent = state.message;
  state.message = "";
}

function drainBattery(amount) {
  if (!state.inventory.includes("flashlight")) {
    return true;
  }

  state.battery = Math.max(0, state.battery - amount);
  updateStatus();

  if (state.battery === 0) {
    endGame(
      "The flashlight goes dark",
      "Your battery runs out in the dark. A bear approaches before you can find your way to safety. Game over."
    );
    return false;
  }

  return true;
}

function makeChoice(text, nextScene, action) {
  return { text, nextScene, action };
}

function getScene(sceneName) {
  switch (sceneName) {
    case "station":
      return {
        title: "Location: Ranger Station",
        character: "Radio",
        text: state.firstStationVisit
          ? "You awake? You better hurry up and see what's happening. Also, it's dark out today; make sure your battery doesn't run out or you won't be able to see."
          : "You hear frightened people chatting outside.",
        choices: [
          makeChoice("Look at the map", "map"),
          ...(!state.inventory.includes("flashlight")
            ? [
                makeChoice("Take the flashlight", "station", function () {
                  state.inventory.push("flashlight");
                  setMessage("You take the flashlight.");
                })
              ]
            : []),
          makeChoice("Use the charging station", "station", function () {
            state.battery = maxBattery;
            updateStatus();
            setMessage("Your flashlight battery is fully charged.");
          }),
          makeChoice("Use the radio", "radio"),
          makeChoice("Go to the campsite", "campsite")
        ]
      };

    case "map":
      return {
        title: "Map",
        character: "",
        text: "The map shows five locations: Ranger Station, Campsite, Shower house, Forest, and Shed.",
        choices: [
          makeChoice("Return to the Ranger Station", "station"),
          makeChoice("Go to the campsite", "campsite")
        ]
      };

    case "radio":
      return {
        title: "Ranger Station Radio",
        character: "Radio",
        text: "So, did you find anything?",
        choices: [
          ...(state.collectedSample
            ? [
                makeChoice("I found red liquid", "station", function () {
                  state.reportedSample = true;
                  setMessage("You report the red liquid sample over the radio.");
                })
              ]
            : []),
          makeChoice("No", "station", function () {
            setMessage("You tell the radio you haven't found anything yet.");
          }),
          ...(state.visitedShed
            ? [
                makeChoice("I heard something in the shed", "station", function () {
                  state.reportedShed = true;
                  setMessage("You report the sounds you heard in the shed.");
                })
              ]
            : []),
          makeChoice("Back to the Ranger Station", "station")
        ]
      };

    case "campsite":
      return {
        title: "Location: Campsite",
        character: "NPC1",
        text: state.campsiteVisits === 1
          ? "There you are! There have been some strange noises in the shower house. You might want to check it out."
          : "The campsite is quiet. NPC1 looks over as you approach.",
        choices: [
          makeChoice("Talk to NPC1", "campTalk"),
          ...(state.inventory.includes("paper towels") &&
          (!state.visitedShed || state.inventory.includes("shed key"))
            ? []
            : [
                makeChoice("Search the campsite", "campSearch", function () {
                  if (!drainBattery(1)) {
                    return;
                  }

                  const found = [];
                  if (!state.inventory.includes("paper towels")) {
                    state.inventory.push("paper towels");
                    found.push("You find paper towels.");
                  } else {
                    found.push("You already have paper towels.");
                  }
                  if (
                    state.visitedShed &&
                    !state.inventory.includes("shed key")
                  ) {
                    state.inventory.push("shed key");
                    found.push("You find a key that may unlock the shed.");
                  } else if (state.inventory.includes("shed key")) {
                    found.push("You already found the shed key.");
                  }
                  state.lastCampSearch = found.join(" ");
                  updateStatus();
                })
              ]),
          makeChoice("Go to the shower house", "shower"),
          makeChoice("Return to the Ranger Station", "station")
        ]
      };

    case "campSearch": {
      return {
        title: "Searching the Campsite",
        character: "",
        text: state.lastCampSearch,
        choices: [
          makeChoice("Back to the campsite", "campsite"),
          makeChoice("Go to the shower house", "shower"),
          makeChoice("Return to the Ranger Station", "station")
        ]
      };
    }

    case "campTalk":
      if (
        state.reportedSample &&
        (state.toldCamperAboutBear || state.toldCamperAboutSample)
      ) {
        return {
          title: "The Mystery Solved",
          character: "NPC1",
          text: "Oh, thankfully it wasn't something way more serious! You also tell NPC1 that you collected and reported the red liquid sample. The camper knows what happened, and the investigation is complete.",
          choices: [makeChoice("Finish", "ending")]
        };
      }
      return {
        title: "At the Campsite",
        character: "NPC1",
        text: state.toldCamperAboutBear
          ? "Oh, thankfully it wasn't something way more serious!"
          : "So... what's up?",
        choices: [
          ...(state.collectedSample
            ? [
                makeChoice(
                  "Found red liquid on the walls",
                  "campTalk",
                  function () {
                    state.toldCamperAboutSample = true;
                    setMessage(
                      state.reportedSample
                        ? "You tell NPC1 that you collected the red liquid and reported it at the Ranger Station."
                        : "You tell NPC1 about the red liquid. You still need to report your sample over the radio."
                    );
                  }
                )
              ]
            : []),
          ...(state.foundBear && !state.toldCamperAboutBear
            ? [
                makeChoice("It was a bear", "campTalk", function () {
                  state.toldCamperAboutBear = true;
                })
              ]
            : []),
          makeChoice("Leave", "campsite")
        ]
      };

    case "shower":
      return {
        title: "Location: Shower house",
        character: "",
        text: "The shower house is dim and quiet.",
        choices: [
          ...(state.inventory.includes("flashlight")
            ? [
                makeChoice("Search the shower house", "showerSearch", function () {
                  state.searchedShowerHouse = true;
                  drainBattery(1);
                })
              ]
            : [
                makeChoice(
                  "It's too dark to search without a flashlight. Return to the Ranger Station.",
                  "station"
                )
              ]),
          makeChoice("Go back to the campsite", "campsite"),
          makeChoice("Go to the shed", "shed"),
          makeChoice("Go to the forest", "forest"),
          makeChoice("Return to the Ranger Station", "station")
        ]
      };

    case "showerSearch":
      return {
        title: "Searching the Shower House",
        character: "",
        text: state.collectedSample
          ? "You move slowly on the wet floors. Red liquid stains the walls and floor; you've already collected a sample."
          : state.inventory.includes("paper towels")
            ? "You move slowly on the wet floors and spot red liquid on the walls and floor. You use the paper towels to collect a sample."
            : "You move slowly on the wet floors and spot red liquid on the walls and floor. You can't take a sample yet; you need paper towels.",
        choices: [
          ...(!state.collectedSample && state.inventory.includes("paper towels")
            ? [
                makeChoice("Collect a sample with the paper towels", "showerSearch", function () {
                  state.collectedSample = true;
                  state.inventory.push("red liquid sample");
                  updateStatus();
                  setMessage("You collect a sample of the red liquid.");
                })
              ]
            : []),
          makeChoice("Back to the shower house", "shower"),
          makeChoice("Go back to the campsite", "campsite"),
          makeChoice("Return to the Ranger Station", "station")
        ]
      };

    case "shed":
      state.visitedShed = true;
      if (state.inventory.includes("shed key")) {
        state.unlockedShed = true;
        state.foundBear = true;
        return {
          title: "Inside the Shed",
          character: "",
          text: "You unlock the shed. A bear is eating food inside, and its paws and muzzle are covered in red sauce.",
          choices: [
            makeChoice("Go back to the shower house", "shower"),
            makeChoice("Go to the campsite", "campsite")
          ]
        };
      }
      return {
        title: "The Shed",
        character: "",
        text: "It's locked; I must find the key. You hear a lot of motion inside...",
        choices: [
          makeChoice("Try the shed door", "shed", function () {
            setMessage("The shed is still locked. You need to find the key.");
          }),
          makeChoice("Go back to the shower house", "shower"),
          makeChoice("Go to the campsite", "campsite")
        ]
      };

    case "forest":
      return {
        title: "The Forest",
        character: "",
        text: "You hear rustling noises and smell food. I should go back...",
        choices: [
          makeChoice("Go back to the shower house", "shower", function () {
            if (drainBattery(1)) {
              state.freeNextShowerEntry = true;
            }
          }),
          makeChoice("Explore", "forestAttack")
        ]
      };

    case "forestAttack":
      return {
        title: "The Forest",
        character: "",
        text: "You explore farther into the forest. A family of bears attacks you. Game over.",
        choices: []
      };

    case "ending":
      return {
        title: "Investigation Complete",
        character: "",
        text: "You made it back to the campsite and shared what you discovered. Thanks for playing!",
        choices: []
      };

    default:
      throw new Error(`Unknown scene: ${sceneName}`);
  }
}

function enterScene(sceneName) {
  if (state.gameOver) {
    return;
  }

  const nextLocation = sceneLocations[sceneName];
  if (nextLocation && nextLocation !== state.location) {
    if (nextLocation === "Campsite") {
      if (!drainBattery(1)) {
        return;
      }
      state.campsiteVisits += 1;
      state.visitedCampsite = true;
    } else if (nextLocation === "Shower house") {
      if (state.freeNextShowerEntry) {
        state.freeNextShowerEntry = false;
      } else if (!drainBattery(1)) {
        return;
      }
      state.visitedShowerHouse = true;
    } else if (nextLocation === "Ranger Station") {
      if (state.location !== null) {
        state.firstStationVisit = false;
      }
    }
    state.location = nextLocation;
  }

  const scene = getScene(sceneName);
  sceneTitle.textContent = scene.title;
  sceneText.textContent = scene.text;
  characterName.textContent = scene.character || "";
  messageDisplay.textContent = state.message;
  state.message = "";
  choicesContainer.innerHTML = "";
  updateStatus();

  scene.choices.forEach(function (choice) {
    const button = document.createElement("button");
    button.textContent = choice.text;
    button.addEventListener("click", function () {
      if (choice.action) {
        choice.action();
      }
      if (state.gameOver) {
        return;
      }
      if (choice.nextScene === "forestAttack") {
        endGame(
          "The Forest",
          "You explore farther into the forest. A family of bears attacks you. Game over."
        );
        return;
      }
      enterScene(choice.nextScene);
    });
    choicesContainer.appendChild(button);
  });
}

const batteryLabel = batteryDisplay.parentElement.previousElementSibling;
if (batteryLabel) {
  batteryLabel.textContent = "Battery Level:";
}

updateStatus();
enterScene("station");
