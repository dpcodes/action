import {NewMeetingSidebar_viewer} from '__generated__/NewMeetingSidebar_viewer.graphql'
import {MeetingTypeEnum} from '__generated__/RemoveOrgUserMutation_team.graphql'
import React from 'react'
import styled from 'react-emotion'
import {createFragmentContainer, graphql} from 'react-relay'
import {Link} from 'react-router-dom'
import LabelHeading from 'universal/components/LabelHeading/LabelHeading'
import LogoBlock from 'universal/components/LogoBlock/LogoBlock'
import MeetingSidebarLabelBlock from 'universal/components/MeetingSidebarLabelBlock'
import NewMeetingSidebarPhaseList from 'universal/components/NewMeetingSidebarPhaseList'
import ScrollableBlock from 'universal/components/ScrollableBlock'
import SidebarToggle from 'universal/components/SidebarToggle'
import {meetingSidebarWidth} from 'universal/styles/meeting'
import appTheme from 'universal/styles/theme/appTheme'
import ui from 'universal/styles/ui'
import {meetingTypeToLabel} from 'universal/utils/meetings/lookups'

const SidebarHeader = styled('div')({
  alignItems: 'center',
  display: 'flex',
  position: 'relative'
})

const StyledToggle = styled(SidebarToggle)({
  margin: '0 .75rem 0 1.5rem'
})

const SidebarParent = styled('div')({
  backgroundColor: ui.palette.white,
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  maxWidth: meetingSidebarWidth,
  minWidth: meetingSidebarWidth,
  padding: '1.25rem 0 0'
})

const TeamDashboardLink = styled(Link)({
  color: ui.copyText,
  fontSize: appTheme.typography.s5,
  fontWeight: 600,
  lineHeight: '1.5',
  ':hover': {
    color: ui.palette.mid,
    cursor: 'pointer'
  }
})

interface Props {
  gotoStageId: (stageId: string) => void
  meetingType: MeetingTypeEnum
  toggleSidebar: () => void
  viewer: NewMeetingSidebar_viewer
}

const NewMeetingSidebar = (props: Props) => {
  const {gotoStageId, meetingType, toggleSidebar, viewer} = props
  const {
    team: {teamId, teamName}
  } = viewer
  const meetingLabel = meetingTypeToLabel[meetingType]
  return (
    <SidebarParent>
      <SidebarHeader>
        <StyledToggle onClick={toggleSidebar} />
        <TeamDashboardLink to={`/team/${teamId}`}>{teamName}</TeamDashboardLink>
      </SidebarHeader>
      <MeetingSidebarLabelBlock>
        <LabelHeading>{`${meetingLabel} Meeting`}</LabelHeading>
      </MeetingSidebarLabelBlock>
      <ScrollableBlock>
        <NewMeetingSidebarPhaseList gotoStageId={gotoStageId} viewer={viewer} />
      </ScrollableBlock>
      <LogoBlock variant='primary' />
    </SidebarParent>
  )
}

export default createFragmentContainer(
  NewMeetingSidebar,
  graphql`
    fragment NewMeetingSidebar_viewer on User {
      ...NewMeetingSidebarPhaseList_viewer
      team(teamId: $teamId) {
        teamId: id
        teamName: name
      }
    }
  `
)
