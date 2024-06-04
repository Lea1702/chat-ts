import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import {
  registerUser,
  sendMessage,
  checkBlockStatus,
  getUsers,
  manageBlock,
  createGroup,
  manageGroupMembers,
  getMessages,
} from './handler'

// Create an API endpoint.
const api = new awsx.classic.apigateway.API('messagingApi', {
  routes: [
    {
      path: '/users/register',
      method: 'POST',
      eventHandler: registerUser,
    },
    {
      path: '/messages/send',
      method: 'POST',
      eventHandler: sendMessage,
    },
    {
      path: '/users/check-block',
      method: 'GET',
      eventHandler: checkBlockStatus,
    },
    {
      path: '/users',
      method: 'GET',
      eventHandler: getUsers,
    },
    {
      path: '/users/block',
      method: 'POST',
      eventHandler: manageBlock,
    },
    {
      path: '/groups/create',
      method: 'POST',
      eventHandler: createGroup,
    },
    {
      path: '/groups/manage',
      method: 'POST',
      eventHandler: manageGroupMembers,
    },
    {
      path: '/messages/group/send',
      method: 'POST',
      eventHandler: sendMessage, // Reusing sendMessage for group messaging with modifications
    },
    {
      path: '/messages',
      method: 'GET',
      eventHandler: getMessages,
    },
  ],
})

// Pulumi exports values
export const apiUrl = api.url
