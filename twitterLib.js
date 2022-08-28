import { GraphQLClient, gql } from 'graphql-request';
import dotenv from 'dotenv';
dotenv.config();
import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: process.env.twitter_appKey,
  appSecret: process.env.twitter_appSecret,
  accessToken: process.env.twitter_accessToken,
  accessSecret: process.env.twitter_accessSecret,
});

// create client for connecting subgraph
const graphQLClient = new GraphQLClient(process.env.graph_server, {})

// fetch content from _camID of thegraph and compare _Urls
export const validateSubmit = async (_camID, _id) => {
  // catch tweetstorm data from subgraph using tweetstrom id
  let cam_content = await getTweetStormDatabyID(_camID);

  try {
    const data = await client.v2.singleTweet(_id, {"tweet.fields": ["entities"]});
    const ret_urls = data.data.entities.urls[0];
    const com_urls = cam_content[0].camp_param_tweetUrl;

    if (ret_urls.url === com_urls || ret_urls.expanded_url === com_urls || ret_urls.display_url === com_urls){
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// get data from subgraph by id
export const getTweetStormDatabyID = async (id) => {
  const query = gql`
      {
        addCampaigns(where: {camp_param_campaignId: "${id}"}) {
          camp_param_shareText
          camp_param_tweetUrl
        }
      }
    `

  const data = await graphQLClient.request(query);
  return data.addCampaigns;
}