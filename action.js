'use strict';

var waitingForReady = false;
var waitingForCompDone = true;
var waitingForBreathsDone = true;
var startCycle = false;
var rescueBreathsComplete = false;
var compressionsComplete = false;
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

     if (event.session.application.applicationId !== "amzn1.ask.skill.6956120e-5ff3-41f3-b156-f482ef7deffb") {
         context.fail("Invalid Application ID");
      }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};


function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);
}


function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}


function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    if ("AnswerIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("StartIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("CPRIntent" === intentName){
        handleCPRRequest(intent,session,callback);
    } else if ("DontKnowIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("QuestionIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if("CPRQuestionIntent" === intentName) {
        handleCPRQuestionIntent(intent,session,callback);
    } else if ("CPREndIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("CPRDoneIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}


function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);
}


var CARD_TITLE = "First Aid";

function getWelcomeResponse(callback) {
    var speechOutput = "First Aid here. What can I help you with?",
        shouldEndSession = false,
     sessionAttributes = { 
         "speechOutput": speechOutput,
         "repromptText": speechOutput,
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
}

function handleCPRRequest(intent, session, callback) {
    if (intent.slots.CPRCommands.value == "restart" || intent.slots.CPRCommands.value == "restart chest compressions" ||
    intent.slots.CPRCommands.value == "restart breaths" || intent.slots.CPRCommands.value == "restart rescue breaths") {
        startCycle = true;
    }
     var speechOutput = " ";
        if (startCycle === false) {
            if (!waitingForReady && startCycle === false) {
                speechOutput = "Lay the person on a firm, flat surface. You will give 30 chest compressions "
                + "Push hard and fast in the middle of the chest at least 2 inches deep and at least 100 compressions per minute "
                + "When you are ready to begin, say 'ready', and when you are done with 30 compressions, say 'done'";
                waitingForReady = true;
            } else if (waitingForReady === true && intent.slots.CPRCommands.value == "ready" && startCycle === false) {
                speechOutput = "Begin chest compressions. I will count at a rate of 100 compressions per minute.";
                for (var count = 1; count <= 30; count++) {
                    speechOutput += " down and up and";
                }
            } else if (waitingForCompDone === true && intent.slots.CPRCommands.value == "done" && startCycle === false) {
                speechOutput = "Now give two rescue breaths. Tilt the head back and lift the chin up."
                + "Pinch the nose shut, then make a complete seal over the person's mouth. "
                + "Blow in for about 1 second to make the chest clearly rise. Give rescue "
                + "breaths, one after the other. When you are done with rescue breaths, say 'done'.";
                waitingForCompDone = false;
            } else if (waitingForBreathsDone === true && waitingForCompDone === false
                && intent.slots.CPRCommands.value == "done" && startCycle === false) {
                speechOutput = "Now we will return to a cycle of chest compressions, then rescue breaths. Say 'stop' when you"
                + " want the cycle to stop.";
                waitingForBreathsDone = false;
                startCycle = true;
            } 
            callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
        }
        
        
        if (startCycle) {
            if ((intent.slots.CPRCommands.value == "ready" && rescueBreathsComplete)|| intent.slots.CPRCommands.value == "restart chest compressions" ||
                intent.slots.CPRCommands.value == "restart") {
                speechOutput = "Begin chest compressions";
                for (count = 1; count <= 30; count++) {
                    speechOutput += " down and up and";
                }
            } else if (intent.slots.CPRCommands.value == "done" || intent.slots.CPRCommands.value == "restart breaths" ||
                intent.slots.CPRCommands.value == "restart rescue breaths") {
                speechOutput = "Begin rescue breaths";
                rescueBreathsComplete = true;
            } else if (intent.slots.CPRCommands.value == "stop" || intent.slots.CPRCommands.value == "end" ||
                intent.slots.CPRCommands.value == "stop CPR" || intent.slots.CPRCommands.value == "quit CPR") {
                speechOutput = "Are you sure you want to stop?"
            } else if (intent.slots.CPRCommands.value == "yes") {
                startCycle = false;
                speechOutput = "Ending CPR cycle."
            } else if (intent.slots.CPRCommands.value == "no") {
                startCycle = true;
            } else {
                speechOutput = "Sorry, I don't understand your request.";
            }
            callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
        } 
    var sessionAttributes = {
        "speechOutput": speechOutput,
         "repromptText": speechOutput
    };
    
}

function handleCPRQuestionIntent(intent,session,callback) {
    var speechOutput = "";
    var sessionAttributes = {};
    var repromptText = "";
    if (intent.slots.CPR.value == "chest compressions") {
        speechOutput = "Lay the person on a firm, flat surface. Push hard and fast in the middle"
        + "of the chest at least 2 inches deep and at least 100 compressions per minute";
    } else if (intent.slots.CPR.value == "rescue breaths" || intent.slots.CPR.value == "breaths") {
        speechOutput = "Tilt the head back and lift the chin up."
            + "Pinch the nose shut, then make a complete seal over the person's mouth. "
            + "Blow in for about 1 second to make the chest clearly rise. Give rescue"
            + "breaths, one after the other.";
    } else {
        speechOutput = "Sorry, I don't understand that request.";
    }
    sessionAttributes = {
         "speechOutput": speechOutput,
         "repromptText": speechOutput,
    };
    callback(sessionAttributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
}

function handleAnswerRequest(intent, session, callback) {
    var speechOutput = "";
    var sessionAttributes = {};
    var answerSlotValid = isAnswerSlotValid(intent);
    var repromptText = "";
    var gameInProgress = session.attributes;

    if (!gameInProgress) {
        sessionAttributes.userPromptedToContinue = true; 
        speechOutput = "First Aid here. What can I help you with?";
        callback(sessionAttributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
    } else if (!answerSlotValid) {
        repromptText = session.attributes.speechOutput;
        speechOutput = "You can ask for help with 1 of 10 injuries. Try saying 'I need help with' and then the injury";
        callback(session.attributes,
            buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
    } else {
        if (intent.slots.Answer.value == "choking") {
            speechOutput = "Is the person conscious or unconscious?";
        } else {
            speechOutput = "Call 911";
        }
        repromptText = session.attributes.speechOutput;
        repromptText = speechOutput;
            sessionAttributes = {
                "speechOutput": speechOutput,
                "repromptText": repromptText,
            };
            callback(sessionAttributes,
                buildSpeechletResponse(CARD_TITLE, speechOutput, repromptText, false));
        }
    }

function handleRepeatRequest(intent, session, callback) {
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.speechOutput, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    var repromptText = "";
    if (!session.attributes) {
        session.attributes = {};
    }

    session.attributes.userPromptedToContinue = true;

    var speechOutput = "For CPR, you can ask how to do chest compressions or rescue breaths by saying 'how do I do' and the "
        + "action, restart the cycle by saying 'restart chest compressions' or restart rescue breaths', and end the cycle "
        + "by saying 'stop CPR' or 'quit CPR'. You can also ask for help with other injuries such as checking an injured adult, "
        + "choking, AED, controlling bleeding " 
        + "burns, poisoning, neck injuries, spinal injuries, or stroke.";
        repromptText = "Ask me about one of the above first aid concerns.";
        var shouldEndSession = false;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}

function isAnswerSlotValid(intent) {
    var answerSlotFilled = intent.slots.Answer;
    return answerSlotFilled;
}

// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}