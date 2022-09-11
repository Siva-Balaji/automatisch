import * as React from 'react';
import { useMutation } from '@apollo/client';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ListItem from '@mui/material/ListItem';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import LoadingButton from '@mui/lab/LoadingButton';

import { EditorContext } from 'contexts/Editor';
import useFormatMessage from 'hooks/useFormatMessage';
import JSONViewer from 'components/JSONViewer';
import { EXECUTE_FLOW } from 'graphql/mutations/execute-flow';
import FlowSubstepTitle from 'components/FlowSubstepTitle';
import type { IStep, ISubstep } from '@automatisch/types';

type TestSubstepProps = {
  substep: ISubstep,
  expanded?: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onChange?: ({ step }: { step: IStep }) => void;
  onSubmit?: () => void;
  step: IStep;
};

function TestSubstep(props: TestSubstepProps): React.ReactElement {
  const {
    substep,
    expanded = false,
    onExpand,
    onCollapse,
    onSubmit,
    step,
  } = props;

  const formatMessage = useFormatMessage();
  const editorContext = React.useContext(EditorContext);
  const [executeFlow, { data, error, loading, called, reset }] = useMutation(EXECUTE_FLOW, { context: { autoSnackbar: false }});
  const response = data?.executeFlow?.data;

  const {
    name,
  } = substep;

  React.useEffect(function resetTestDataOnSubstepToggle() {
    if (!expanded) {
      reset();
    }
  }, [expanded, reset])

  const handleSubmit = React.useCallback(() => {
    executeFlow({
      variables: {
        input: {
          stepId: step.id,
        },
      },
    })
  }, [onSubmit, step.id]);
  const onToggle = expanded ? onCollapse : onExpand;

  return (
    <React.Fragment>
      <FlowSubstepTitle
        expanded={expanded}
        onClick={onToggle}
        title={name}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <ListItem sx={{ pt: 2, pb: 3, flexDirection: 'column', alignItems: 'flex-start' }}>
          {error?.graphQLErrors?.length && <Alert severity="error" sx={{ mb: 1, fontWeight: 500, width: '100%' }}>
            {error?.graphQLErrors.map((error) => (<>{error.message}<br /></>))}
          </Alert>}

          {called && !loading && !error && !response && (
            <Alert severity="warning" sx={{ mb: 1, width: '100%' }}>
              <AlertTitle sx={{ fontWeight: 700 }}>{formatMessage('flowEditor.noTestDataTitle')}</AlertTitle>

              <Box sx={{ fontWeight: 400 }}>{formatMessage('flowEditor.noTestDataMessage')}</Box>
            </Alert>
          )}

          {response && (
            <Box sx={{ maxHeight: 400, overflowY: 'auto', width: '100%' }}>
              <JSONViewer data={response} />
            </Box>
          )}

          <LoadingButton
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
            loading={loading}
            disabled={editorContext.readOnly}
            color="primary"
          >
            Test & Continue
          </LoadingButton>
        </ListItem>
      </Collapse>
    </React.Fragment>
  );
};

export default TestSubstep;
