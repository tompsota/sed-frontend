import {
  Bullseye,
  Button,
  Flex,
  FlexItem,
  Spinner,
  Split,
  SplitItem,
  Page,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/redux';
import {
  PageHeader,
  PageHeaderTitle,
} from '@redhat-cloud-services/frontend-components/PageHeader';
import React, {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Route, useHistory } from 'react-router-dom';
import pckg from '../../../package.json';
import ConfirmChangesModal from '../../Components/ConfirmChangesModal';
import Services from '../../Components/Services/Services';
import { RegistryContext } from '../../store';
import {
  fetchConnectedHosts,
  fetchCurrState,
  saveCurrState,
} from '../../store/actions';
import connectedSystemsReducer from '../../store/connectedSystems';
import activeStateReducer from '../../store/currStateReducer';
import logReducer from '../../store/logReducer';
import './dashboard.scss';

const { routes: paths } = pckg;

const AboutRemoteHostConfigPopover = lazy(() =>
  import(
    /* webpackChunkName: "ConnectSysAboutRemoteHostConfigPopovertemsModal" */ '../../Components/AboutRemoteHostConfigPopover/AboutRemoteHostConfigPopover'
  )
);

const ConnectLog = lazy(() =>
  import(/* webpackChunkName: "ConnectLog" */ '../../Components/ConnectLog')
);

const SamplePage = () => {
  const history = useHistory();
  const { getRegistry } = useContext(RegistryContext);
  const [confirmChangesOpen, setConfirmChangesOpen] = useState(false);
  const [madeChanges, setMadeChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dataRef = useRef();
  const dispatch = useDispatch();

  const activeStateLoaded = useSelector(
    ({ activeStateReducer }) => activeStateReducer?.loaded
  );
  const { useOpenSCAP, enableCloudConnector, apply_state } = useSelector(
    ({ activeStateReducer }) => ({
      useOpenSCAP: activeStateReducer?.values?.useOpenSCAP,
      enableCloudConnector: activeStateReducer?.values?.enableCloudConnector,
      apply_state: activeStateReducer?.values?.apply_state,
    }),
    shallowEqual
  );
  const { systemsCount } = useSelector(
    ({ connectedSystemsReducer }) => ({
      systemsLoaded: connectedSystemsReducer?.loaded,
      systemsCount: connectedSystemsReducer?.total,
    }),
    shallowEqual
  );

  useEffect(() => {
    getRegistry().register({
      activeStateReducer,
      logReducer,
      connectedSystemsReducer,
    });
    dispatch(fetchCurrState());
    dispatch(fetchConnectedHosts());
  }, [getRegistry]);

  useEffect(() => {
    insights?.chrome?.appAction?.('cloud-connector-dashboard');
  }, []);

  return (
    <React.Fragment>
      <Route
        exact
        path={paths.logModal}
        render={() => (
          <Suspense
            fallback={
              <Bullseye>
                <Spinner />
              </Bullseye>
            }
          >
            <ConnectLog />
          </Suspense>
        )}
      />
      <PageHeader className="page-header">
        <Split hasGutter className="page-title">
          <SplitItem isFilled>
            <Flex>
              <FlexItem spacer={{ default: 'spacerSm' }}>
                <PageHeaderTitle title="Remote Host Configuration Manager" />
              </FlexItem>
              <FlexItem>
                <AboutRemoteHostConfigPopover />
              </FlexItem>
            </Flex>
          </SplitItem>
          <SplitItem>
            <Button onClick={() => history.push(paths.logModal)} variant="link">
              View log
            </Button>
          </SplitItem>
        </Split>
        <Stack hasGutter>
          <StackItem>
            Selections here affect Red Hat Enterprise Linux (RHEL) systems
            connected to Red Hat with remote host configuration (rhc). Upon
            saving changes, Ansible Playbooks are automatically pushed to
            connected systems to update the configuration of the connection to
            Red Hat.
          </StackItem>
          <StackItem>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={
                'https://access.redhat.com/documentation/en-us/red_hat_insights/2022/html-single/red_hat_connector_configuration_guide/index'
              }
            >
              Connecting with Red Hat
              {<ExternalLinkAltIcon className="pf-u-ml-sm" />}
            </a>
          </StackItem>
        </Stack>
      </PageHeader>
      <Page>
        <div className="dashboard__content">
          {activeStateLoaded ||
          (useOpenSCAP !== undefined && enableCloudConnector !== undefined) ? (
            <Services
              madeChanges={madeChanges}
              setConfirmChangesOpen={setConfirmChangesOpen}
              setMadeChanges={setMadeChanges}
              setIsEditing={setIsEditing}
              isEditing={isEditing}
              defaults={{
                useOpenSCAP,
                enableCloudConnector,
                apply_state,
              }}
              onChange={(data) => {
                dataRef.current = data;
              }}
            />
          ) : (
            <Bullseye>
              <Spinner className="pf-u-p-lg" size="xl" />
            </Bullseye>
          )}
        </div>
      </Page>
      <ConfirmChangesModal
        isOpen={confirmChangesOpen}
        handleCancel={() => setConfirmChangesOpen(false)}
        systemsCount={systemsCount}
        data={dataRef.current}
        handleConfirm={() => {
          setConfirmChangesOpen(false);
          (async () => {
            const saveAction = saveCurrState(dataRef.current);
            dispatch(saveAction);
            await saveAction.payload;
            dispatch(
              addNotification({
                variant: 'success',
                title: 'Changes saved',
                description:
                  'Your service enablement changes were applied to connected systems',
              })
            );
            setMadeChanges(false);
            setIsEditing(false);
          })();
        }}
      />
    </React.Fragment>
  );
};

export default SamplePage;
