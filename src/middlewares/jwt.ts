import { APIGatewayTokenAuthorizerEvent, APIGatewayRequestAuthorizerEvent, Callback, Context, PolicyDocument } from 'aws-lambda'
import jwt from 'jsonwebtoken'

import { PolicyResponse, TokenPayload } from '../interfaces/auth.interface'
import { checkPermissions } from '../utils/auth'
import { JWT_SECRET } from '../configs/constants'

// TODO: roles attribute should check only if one of the role is present in user
const check = (event: APIGatewayRequestAuthorizerEvent, context: Context, callback: Callback) => {
// const check = (event: APIGatewayTokenAuthorizerEvent, context: Context, callback: Callback) => {
  try {
    // const check = (event: APIGatewayTokenAuthorizerEvent, context: Context, callback: Callback) => {
      // const authorization: string = event.authorizationToken
      const authorization: string = event.headers.Authorization
      const { resourcePath, httpMethod } = event.requestContext
      // const token = authorization.slice(7, authorization.length) 
      const token = extract_access_token(authorization)
      // TODO: put a custom message if Unauthorized
      if (!token) {
        console.log('Token not available')
        return callback(null, 'Unauthorized')
      }
      // TODO: sa inlocuiesc cheiasupersecreta cu environment variables
      jwt.verify(token, JWT_SECRET, (err, decoded: TokenPayload) => {
        if (err) {
          console.log('err from jet.verify: ', err)
          return callback(null, 'Unauthorized')
        }
        if (!checkPermissions(decoded.userPayload.roles, resourcePath, httpMethod)) {
          return callback(null, 'Unauthorized')
        }
        return callback(null, generatePolicy({id: decoded.userPayload.id}, 'Allow', event.methodArn))
      })
    } catch (error) {
      console.log(error)
      return callback(null, 'Unauthorized')
    }
}

// TODO: add User interface first argument
const generatePolicy = (user: {id: number}, effect: string, resource:string) => {
  const authResponse: PolicyResponse = {
    context: {user},
    principalId: user.id,
    policyDocument: null
  }
  if(effect && resource) {
    const statementOne: any = {
      'Action': 'execute-api:Invoke',
      'Effect': effect,
      'Resource': resource,
    };

    const policyDocument: PolicyDocument = {
      Version: '2012-10-17',
      Statement: [statementOne],
    };
    // TODO: fix this
    authResponse.policyDocument = policyDocument;
  }
  return authResponse
}

const extract_access_token = (authorization) => {
  // If the value of Authorization header is not available.
  if (!authorization)
  {
    // No access token.
    return null;
  }

  // Check if it matches the pattern "Bearer {access-token}".
  const BEARER_TOKEN_PATTERN = /^Bearer[ ]+([^ ]+)[ ]*$/i;
  const result = BEARER_TOKEN_PATTERN.exec(authorization);

  // If the Authorization header does not match the pattern.
  if (!result)
  {
    // No access token.
    return null;
  }

  // Return the access token.
  return result[1];
}

export { check }