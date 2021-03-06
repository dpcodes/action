import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {forwardConnectionArgs} from 'graphql-relay'
import CreditCard from 'server/graphql/types/CreditCard'
import GraphQLISO8601Type from 'server/graphql/types/GraphQLISO8601Type'
import GraphQLURLType from 'server/graphql/types/GraphQLURLType'
import {OrganizationMemberConnection} from 'server/graphql/types/OrganizationMember'
import OrgUserCount from 'server/graphql/types/OrgUserCount'
import TierEnum from 'server/graphql/types/TierEnum'
import User from 'server/graphql/types/User'
import {getUserId} from 'server/utils/authorization'
import {BILLING_LEADER} from 'universal/utils/constants'
import {resolveForBillingLeaders} from 'server/graphql/resolvers'

const Organization = new GraphQLObjectType({
  name: 'Organization',
  description: 'An organization',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID), description: 'The unique organization ID'},
    createdAt: {
      type: new GraphQLNonNull(GraphQLISO8601Type),
      description: 'The datetime the organization was created'
    },
    creditCard: {
      type: CreditCard,
      description: 'The safe credit card details',
      resolve: resolveForBillingLeaders('creditCard')
    },
    isBillingLeader: {
      type: GraphQLBoolean,
      description: 'true if the viewer is the billing leader for the org',
      resolve ({orgUsers}, args, {authToken}) {
        const viewerId = getUserId(authToken)
        return Boolean(
          orgUsers.find((user) => user.id === viewerId && user.role === BILLING_LEADER)
        )
      }
    },
    mainBillingLeader: {
      type: User,
      description: 'The billing leader of the organization (or the first, if more than 1)',
      resolve: ({orgUsers}, args, {dataLoader}) => {
        const firstBillingLeader = orgUsers.find((user) => user.role === BILLING_LEADER)
        return firstBillingLeader ? dataLoader.get('users').load(firstBillingLeader.id) : undefined
      }
    },
    name: {
      type: GraphQLString,
      description: 'The name of the organization'
    },
    picture: {
      type: GraphQLURLType,
      description: 'The org avatar'
    },
    tier: {
      type: TierEnum,
      description: 'The level of access to features on the parabol site'
    },
    periodEnd: {
      type: GraphQLISO8601Type,
      description: 'THe datetime the current billing cycle ends',
      resolve: resolveForBillingLeaders('periodEnd')
    },
    periodStart: {
      type: GraphQLISO8601Type,
      description: 'The datetime the current billing cycle starts',
      resolve: resolveForBillingLeaders('periodStart')
    },
    retroMeetingsOffered: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'The total number of retroMeetings given to the team'
    },
    retroMeetingsRemaining: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'Number of retro meetings that can be run (if not pro)'
    },
    stripeId: {
      type: GraphQLID,
      description: 'The customerId from stripe',
      resolve: resolveForBillingLeaders('stripeId')
    },
    stripeSubscriptionId: {
      type: GraphQLID,
      description: 'The subscriptionId from stripe',
      resolve: resolveForBillingLeaders('stripeSubscriptionId')
    },
    updatedAt: {
      type: GraphQLISO8601Type,
      description: 'The datetime the organization was last updated'
    },
    orgMembers: {
      args: {
        ...forwardConnectionArgs
      },
      type: OrganizationMemberConnection,
      async resolve ({id: orgId, orgUsers}, {first}, {dataLoader}) {
        if (!Array.isArray(orgUsers)) return null

        // RESOLUTION
        const limitedOrgUsers = orgUsers.slice(0, first)

        const userIds = limitedOrgUsers.map(({id}) => id)
        const users = await dataLoader.get('users').loadMany(userIds)
        users.sort(
          (a, b) => (a.preferredName.toLowerCase() > b.preferredName.toLowerCase() ? 1 : -1)
        )
        const edges = users.map((user) => ({
          cursor: user.preferredName.toLowerCase(),
          node: {
            userId: user.id,
            orgId
          }
        }))

        const firstEdge = edges[0]
        return {
          edges,
          pageInfo: {
            endCursor: firstEdge && edges[edges.length - 1].cursor,
            hasNextPage: false
          }
        }
      }
    },
    orgUserCount: {
      type: new GraphQLNonNull(OrgUserCount),
      description: 'The count of active & inactive users',
      resolve: async (source) => {
        const {orgUsers} = source
        if (!Array.isArray(orgUsers)) throw new Error('No orgUsers supplied!')
        const inactiveUserCount = orgUsers.filter((orgUser) => orgUser.inactive).length
        return {
          inactiveUserCount,
          activeUserCount: orgUsers.length - inactiveUserCount
        }
      }
    },
    billingLeaders: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(User))),
      description: 'The leaders of the org',
      resolve: async ({orgUsers}, args, {dataLoader}) => {
        const billingLeaderUserIds = orgUsers
          .filter((orgUser) => orgUser.role === BILLING_LEADER)
          .map(({id}) => id)
        return dataLoader.get('users').loadMany(billingLeaderUserIds)
      }
    }
  })
})

export default Organization
