//Import libraries
import type {Handler, HandlerEvent, HandlerContext, HandlerCallback} from "@netlify/functions";
import {App, AwsLambdaReceiver, LogLevel} from "@slack/bolt";
import "dotenv/config";

//Bolt receiver built for Lambda works for Netlify functions too ->
const receiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,

});

//create Bolt app instance
const app = new App({
    token:      process.env.SLACK_BOT_TOKEN, //bot OAuth token
    receiver,
    logLevel: LogLevel.DEBUG,
});


//shortcuts to env values
const FIELD_ID = process.env.MANAGER_FIELD_ID!; //'!' tells ts it will exist
const WORKFLOW = process.env.WORKFLOW_LINK!;

const ALLOWEDU = new Set ([
    "U08SMCV0TEK",
]);

//event handler - once per new slack member
app.event("user_change", async ({event, client, logger}) => {
    const user: any = event.user; // carries the new user object

    if (!ALLOWEDU.has(user.id)) return;

    //skip guest accuounts - multi-channel or single-channel
    if (user.is_restricted || user.is_ultra_restricted) return;
        
    //fetch the user's full profile so we can see manager field
    const prof = await client.users.profile.get({user: user.id});
    const managerID: string | undefined = prof.profile?.fields?.[FIELD_ID]?.value;

    //Is this the correct wat to handle this case??
    if(!managerID){
            logger.warn(`No Manager set for ${user.id}`);
            return;                 //quit if no manager
       }

    //send manager a DM with a button that opens to workflow link
    await client.chat.postMessage({
        channel: managerID,
        text: 'A new teammate <@${user.id}> just joined. Add them to channels?',
        blocks: [{
            type: "actions",
            elements: [{
                type: "button",
                text: {type: "plain_text", text: "Add to channels:"},
                url: WORKFLOW, 
                value: user.id //optional metadata string the workflow can read
            }]
        }]
    });
    console.log("sent DM")
});

//Netlify Function export 

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const lambdaHandler = await receiver.start();
    return lambdaHandler(event as any, context as any, () => undefined);
};

/*console.log("script loaded, starting......")
//Import libraries
import type {Handler, HandlerEvent, HandlerContext, HandlerCallback} from "@netlify/functions";
import {App, AwsLambdaReceiver, LogLevel} from "@slack/bolt";
import "dotenv/config";

//Bolt receiver built for Lambda works for Netlify functions too ->
const receiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,

});

//create Bolt app instance
const app = new App({
    token:      process.env.SLACK_BOT_TOKEN, //bot OAuth token
    receiver,
    logLevel: LogLevel.DEBUG,
});


//shortcuts to env values
const FIELD_ID = process.env.MANAGER_FIELD_ID!; //'!' tells ts it will exist
const WORKFLOW = process.env.WORKFLOW_LINK!;


//event handler - once per new slack member
app.event("team_join", async ({event, client, logger}) => {
    const user: any = event.user; //payload carries the new user object

    //skip guest accounts - multi-channel or single-channel
    if (user.is_restricted || user.is_ultra_restricted) return;
        
    //fetch the user's full profile so we can see manager field
    const prof = await client.users.profile.get({user: user.id});
    const managerID: string | undefined = prof.profile?.fields?.[FIELD_ID]?.value;

    //Is this the correct wat to handle this case??
    if(!managerID){
            logger.warn('No Manager set for $(user.id}');
            return;                 //quit if no manager
       }

    //send manager a DM with a button that opens to workflow link
    await client.chat.postMessage({
        channel: managerID,
        text: 'A new teammate <@${user.id}> just joined. Add them to channels?',
        blocks: [{
            type: "actions",
            elements: [{
                type: "button",
                text: {type: "plain_text", text: "Add to channels:"},
                url: WORKFLOW, 
                value: user.id //optional metadata string the workflow can read
            }]
        }]
    });
    console.log("sent DM")
});

//Netlify Function export 

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const lambdaHandler = await receiver.start();
    return lambdaHandler(event as any, context as any, () => undefined);
};*/