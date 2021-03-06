import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {DropTarget as dropTarget} from 'react-dnd'
import {createFragmentContainer} from 'react-relay'
import withAtmosphere from 'universal/decorators/withAtmosphere/withAtmosphere'
import handleAgendaHover from 'universal/dnd/handleAgendaHover'
import handleDrop from 'universal/dnd/handleDrop'
import withDragState from 'universal/dnd/withDragState'
import AgendaItem from 'universal/modules/teamDashboard/components/AgendaItem/AgendaItem'
import RemoveAgendaItemMutation from 'universal/mutations/RemoveAgendaItemMutation'
import appTheme from 'universal/styles/theme/appTheme'
import ui from 'universal/styles/ui'
import {meetingSidebarGutter} from 'universal/styles/meeting'
import {AGENDA_ITEM, phaseArray} from 'universal/utils/constants'
// import SexyScrollbar from 'universal/components/Dashboard/SexyScrollbar'
import ScrollableBlock from 'universal/components/ScrollableBlock'
import styled, {css} from 'react-emotion'

const columnTarget = {
  drop: handleDrop,
  hover: handleAgendaHover
}

const agendaListRoot = {
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100% - 3.625rem)',
  width: '100%'
}

const EmptyBlock = styled('div')({
  alignItems: 'flex-start',
  display: 'flex',
  padding: meetingSidebarGutter,
  paddingTop: 0
})

const EmptyEmoji = styled('div')({
  fontSize: appTheme.typography.s4,
  minWidth: '2rem',
  paddingLeft: '1.375rem'
})

const EmptyMessage = styled('div')({
  color: ui.palette.dark,
  flex: 1,
  fontSize: appTheme.typography.s2,
  lineHeight: '1.5',
  paddingLeft: '.5rem',
  paddingTop: '.25rem'
})

const AgendaItemsLoadingBlock = styled('div')({
  padding: meetingSidebarGutter,
  paddingLeft: '1.625rem',
  paddingTop: 0,
  width: '100%'
})

const AgendaItemLoading = styled('div')({
  display: 'flex',
  padding: `${meetingSidebarGutter} 0`,

  '::before': {
    backgroundColor: appTheme.palette.mid20l,
    borderRadius: ui.borderRadiusSmall,
    display: 'block',
    content: '""',
    flex: 1,
    height: '1.5rem',
    marginRight: meetingSidebarGutter
  },

  '::after': {
    backgroundColor: appTheme.palette.mid50l,
    borderRadius: '100%',
    display: 'block',
    content: '""',
    height: '1.5rem',
    width: '1.5rem'
  }
})

class AgendaList extends Component {
  static propTypes = {
    atmosphere: PropTypes.object.isRequired,
    agendaPhaseItem: PropTypes.number,
    canNavigate: PropTypes.bool,
    connectDropTarget: PropTypes.func.isRequired,
    context: PropTypes.string,
    disabled: PropTypes.bool,
    dragState: PropTypes.object.isRequired,
    facilitatorPhase: PropTypes.oneOf(phaseArray),
    facilitatorPhaseItem: PropTypes.number,
    gotoAgendaItem: PropTypes.func,
    inSync: PropTypes.bool,
    localPhase: PropTypes.oneOf(phaseArray),
    localPhaseItem: PropTypes.number,
    styles: PropTypes.object,
    visibleAgendaItemId: PropTypes.string,
    submittedCount: PropTypes.number,
    team: PropTypes.object.isRequired
  }

  state = {
    filteredAgendaItems: []
  }

  componentWillMount () {
    this.setFilteredAgendaItems(this.props)
  }

  componentWillReceiveProps (nextProps) {
    const {
      team: {agendaItems, contentFilter}
    } = nextProps
    const {
      team: {agendaItems: oldAgendaItems, contentFilter: oldContentFilter}
    } = this.props
    if (agendaItems !== oldAgendaItems || contentFilter !== oldContentFilter) {
      this.setFilteredAgendaItems(nextProps)
    }
  }

  setFilteredAgendaItems = (props) => {
    const {
      team: {agendaItems, contentFilter}
    } = props
    this.setState({
      filteredAgendaItems: contentFilter
        ? agendaItems.filter(({content}) => content.match(contentFilter))
        : agendaItems
    })
  }

  makeLoadingState () {
    const loadingItem = <AgendaItemLoading />
    return (
      <AgendaItemsLoadingBlock>
        {loadingItem}
        {loadingItem}
        {loadingItem}
      </AgendaItemsLoadingBlock>
    )
  }

  makeEmptyState () {
    const {context} = this.props
    const meetingContext = context === 'dashboard' ? 'next meeting' : 'meeting'
    return (
      <EmptyBlock>
        <EmptyEmoji>🤓</EmptyEmoji>
        <EmptyMessage>
          {`Pssst. Add topics for your ${meetingContext}! Use a phrase like “`}
          <b>
            <i>{'upcoming vacation'}</i>
          </b>
          {'.”'}
        </EmptyMessage>
      </EmptyBlock>
    )
  }

  removeItemFactory = (agendaId) => () => {
    const {atmosphere} = this.props
    RemoveAgendaItemMutation(atmosphere, agendaId)
  }

  render () {
    const {
      agendaPhaseItem,
      canNavigate,
      connectDropTarget,
      disabled,
      dragState,
      facilitatorPhase,
      facilitatorPhaseItem,
      gotoAgendaItem,
      inSync,
      localPhase,
      localPhaseItem,
      visibleAgendaItemId,
      team
    } = this.props
    const {filteredAgendaItems} = this.state
    const {agendaItems} = team
    const canNavigateItems = canNavigate && !disabled
    dragState.clear()
    // TODO handle isLoading
    const isLoading = false
    if (filteredAgendaItems.length === 0) {
      return isLoading ? this.makeLoadingState() : this.makeEmptyState()
    }

    return connectDropTarget(
      <div className={css(agendaListRoot)}>
        <ScrollableBlock>
          {filteredAgendaItems.map((item, idx) => (
            <AgendaItem
              key={`agendaItem${item.id}`}
              agendaItem={item}
              agendaLength={filteredAgendaItems.length}
              agendaPhaseItem={agendaPhaseItem}
              canNavigate={canNavigateItems}
              disabled={disabled}
              ensureVisible={visibleAgendaItemId === item.id}
              facilitatorPhase={facilitatorPhase}
              gotoAgendaItem={gotoAgendaItem && gotoAgendaItem(idx)}
              handleRemove={this.removeItemFactory(item.id)}
              idx={agendaItems.findIndex((agendaItem) => agendaItem === item)}
              inSync={inSync}
              isCurrent={idx + 1 === agendaPhaseItem}
              isFacilitator={idx + 1 === facilitatorPhaseItem}
              localPhase={localPhase}
              localPhaseItem={localPhaseItem}
              ref={(c) => {
                if (c) {
                  dragState.components.push(c)
                }
              }}
            />
          ))}
        </ScrollableBlock>
      </div>
    )
  }
}

// <SexyScrollbar color='rgba(0, 0, 0, 0.3)' activeColor='rgba(0, 0, 0, 0.5)'>
//  {(scrollRef) => {
//    return (
//      <div ref={scrollRef}>
//        {/* wrap filteredAgendaItems here */}
//      </div>
//    )
//  }}
// </SexyScrollbar>

const dropTargetCb = (connectTarget) => ({
  connectDropTarget: connectTarget.dropTarget()
})

export default createFragmentContainer(
  withAtmosphere(withDragState(dropTarget(AGENDA_ITEM, columnTarget, dropTargetCb)(AgendaList))),
  graphql`
    fragment AgendaList_team on Team {
      contentFilter
      agendaItems {
        id
        content
        # need these 2 for the DnD
        isComplete
        sortOrder
        ...AgendaItem_agendaItem
      }
    }
  `
)
