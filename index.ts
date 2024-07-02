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
  // listTables,
} from './handler'

const usersTable = new aws.dynamodb.Table('usersTable', {
  attributes: [
    { name: 'userId', type: 'S' },
    { name: 'username', type: 'S' },
  ],
  hashKey: 'userId',
  billingMode: 'PROVISIONED',
  readCapacity: 1,
  writeCapacity: 1,
  globalSecondaryIndexes: [
    {
      name: 'UsernameIndex',
      hashKey: 'username',
      projectionType: 'ALL',
      readCapacity: 1,
      writeCapacity: 1,
    },
  ],
})

const groupsTable = new aws.dynamodb.Table('groupsTable', {
  attributes: [{ name: 'groupId', type: 'S' }],
  hashKey: 'groupId',
  billingMode: 'PROVISIONED',
  readCapacity: 1,
  writeCapacity: 1,
})

const messagesTable = new aws.dynamodb.Table('messagesTable', {
  attributes: [
    { name: 'messageId', type: 'S' },
    { name: 'senderId', type: 'S' },
    { name: 'receiverId', type: 'S' },
    { name: 'timestamp', type: 'S' },
    { name: 'read', type: 'BOOL' },
  ],
  hashKey: 'messageId',
  rangeKey: 'timestamp', // Add this line to specify the sort key

  billingMode: 'PROVISIONED',
  readCapacity: 1,
  writeCapacity: 1,
  globalSecondaryIndexes: [
    {
      name: 'SenderIdIndex',
      hashKey: 'senderId',
      rangeKey: 'timestamp', // Add this line to specify the sort key

      projectionType: 'ALL',
      readCapacity: 1,
      writeCapacity: 1,
    },
    {
      name: 'ReceiverIdIndex',
      hashKey: 'receiverId',
      rangeKey: 'timestamp', // Add this line to specify the sort key

      projectionType: 'ALL',
      readCapacity: 1,
      writeCapacity: 1,
    },
  ],
})

export const Users = usersTable.name
export const Groups = groupsTable.name
export const Messages = messagesTable.name

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
    // {
    //   path: '/tables',
    //   method: 'GET',
    //   eventHandler: listTables,
    // },
  ],
})

// Pulumi exports values
export const apiUrl = api.url
