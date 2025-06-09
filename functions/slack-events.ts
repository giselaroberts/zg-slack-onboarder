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
//DELETE AFTER TESTING
const ALLOWEDU = new Set ([
    "U08SMCV0TEK",
]);
const url = new URL(process.env.WORKFLOW_LINK!);
//url.searchParams.set("user_id", user.id)


//event handler - once per new slack member
app.event("user_change", async ({event, client, logger}) => {
    const user: any = event.user; //carries the new user object
    
    console.log(user.id)

    //only me (for testing)DELETE AFTER TESTING
    if (!ALLOWEDU.has(user.id)) return;

    //skip guest accounts - multi-channel or single-channel
    if (user.is_restricted || user.is_ultra_restricted) return;
        
    //fetch the user's full profile so we can see manager field
    const prof = await client.users.profile.get({user: user.id});
    const managerID: string | undefined = prof.profile?.fields?.[FIELD_ID]?.value;

    //warn and quit if no manager
    if(!managerID){
            logger.warn('No Manager set for $(user.id}');
            return;                 //quit if no manager
       }

    const url = new URL(process.env.WORKFLOW_LINK!);

    //send manager a DM with a button that opens to workflow link
    await client.chat.postMessage({
        //channel: managerID,
        channel: user.id,
        text: `A new teammate <@${user.id}> just joined. Add them to channels?\n`+"If you have multiple new hires starting today, use the same workflow for each new hire using the Start Workflow button"+ `<${url.toString()}| >`
    });
    console.log("Sent DM");
});


//Netlify Function export 

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const lambdaHandler = await receiver.start();
    return lambdaHandler(event as any, context as any, () => undefined);
};
