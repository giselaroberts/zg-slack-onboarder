console.log("script loaded, starting......")
//Import libraries
import {App, LogLevel} from "@slack/bolt";
import "dotenv/config";

//create Bolt app instance
const app = new App({
    token:      process.env.SLACK_BOT_TOKEN, //bot OAuth token
    appToken:   process.env.SLACK_APP_TOKEN, //app-level Socket token
    socketMode: true,                        //use WebSocket, no public URL needed
    logLevel:   LogLevel.INFO,               //show info-level logs in console
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
});

//start the socket connection

(async () => {
    await app.start();
    console.log("Onboard-bot running");
})();
