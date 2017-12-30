import handleAddTeamMembers from 'universal/mutations/handlers/handleAddTeamMembers';
import {handleNotification} from 'universal/subscriptions/NotificationsAddedSubscription';
import safeRemoveNodeFromArray from 'universal/utils/relay/safeRemoveNodeFromArray';

// eslint-disable-next-line no-unused-expressions
graphql`
  fragment TeamMemberSubscription_teamMember on TeamMember {
    id
    checkInOrder
    isLead
    isCheckedIn
    isConnected
    isNotRemoved
    picture
    preferredName
    teamId
  }
`;

const subscription = graphql`
  subscription TeamMemberSubscription {
    teamMemberSubscription {
      __typename
      ... on TeamMemberAdded {
        teamMember {
          ...TeamMemberSubscription_teamMember
        }
        notification {
          type
          preferredName
          team {
            name
          }
        }
      }
      ... on TeamMemberUpdated {
        teamMember {
          ...TeamMemberSubscription_teamMember
        }
      }
    }
  }

`;

export const handleUpdateTeamMember = (store, updatedTeamMember) => {
  if (!updatedTeamMember) return;
  const teamId = updatedTeamMember.getValue('teamId');
  const isNotRemoved = updatedTeamMember.getValue('isNotRemoved');
  const team = teamId && store.get(teamId);
  if (!team) return;
  const sorts = ['checkInOrder', 'preferredName'];
  if (isNotRemoved) {
    sorts.forEach((sortBy) => {
      const teamMembers = team.getLinkedRecords('teamMembers', {sortBy});
      if (!teamMembers) return;
      teamMembers.sort((a, b) => a.getValue(sortBy) > b.getValue(sortBy) ? 1 : -1);
      team.setLinkedRecords(teamMembers, 'teamMembers', {sortBy});
    });
  } else {
    const teamMemberId = updatedTeamMember.getValue('id');
    sorts.forEach((sortBy) => {
      const teamMembers = team.getLinkedRecords('teamMembers', {sortBy});
      safeRemoveNodeFromArray(teamMemberId, teamMembers, 'teamMembers', {storageKeyArgs: {sortBy}});
    });
  }
};

const TeamMemberSubscription = (environment, queryVariables, subParams) => {
  const {dispatch} = subParams;
  return {
    subscription,
    variables: {},
    updater: (store) => {
      const payload = store.getRootField('teamMemberSubscription');
      const teamMember = payload.getLinkedRecord('teamMember');
      const type = payload.getValue('__typename');
      if (type === 'TeamMemberAdded') {
        const notification = payload.getLinkedRecord('notification');
        handleAddTeamMembers(teamMember, store);
        handleNotification(notification, {dispatch});
      } else if (type === 'TeamMemberUpdated') {
        handleUpdateTeamMember(store, teamMember);
      }
    }
  };
};

export default TeamMemberSubscription;