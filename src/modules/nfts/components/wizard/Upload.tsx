import Button from '@/common/components/elements/Button';
import { Layout, PageHeader, Space, Upload, message, notification } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { StepWizardChildProps } from 'react-step-wizard';
import { MintDispatch } from 'pages/nfts/new';
import { DraggerProps } from 'antd/lib/upload';
import { UploadFile } from 'antd/lib/upload/interface';
const { Dragger } = Upload;

export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 100000000;
// For reference https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept
export const NFT_MIME_TYPE_UPLOAD_VALIDATION_STRING =
  'image/jpeg,image/png,image/gif,image/svg+xml,video/mp4,video/mov,audio/mp3,audio/wave,audio/flac,.glb';

const StyledLayout = styled(Layout)`
  display: flex;
  align-items: center;
  @media only screen and (min-width: 768px) {
    padding: 61px 142px 97px;
  }
`;

const Header = styled(PageHeader)`
  font-style: normal;
  font-weight: 900;
  font-size: 3rem;
  line-height: 3rem;
  text-align: center;
  color: #fff;
  width: 100%;

  @media only screen and (min-width: 768px) {
    width: 701px;
  }
`;

const Copy = styled.p<{ transparent?: boolean }>`
  color: #fff;
  font-size: 20px;
  font-style: normal;
  font-weight: 400;
  line-height: 27px;
  letter-spacing: 0em;
  text-align: center;
  ${(p) => (p.transparent ? 'opacity: 0.6;' : null)}
`;

const StyledSpace = styled(Space)`
  max-width: 80%;
  @media only screen and (min-width: 768px) {
    padding: 101px;
    width: 856px;
  }
`;

interface Props extends Partial<StepWizardChildProps> {
  dispatch: MintDispatch;
  files: Array<File>;
  clearForm: () => void;
}

export default function UploadStep({ nextStep, dispatch, files, clearForm }: Props) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [fileTooBig, setFileTooBig] = useState(false);

  let count = 0;

  const resetAll = () => {
    setFileList([]);
    setFileTooBig(false);
    clearForm();
  };

  const draggerProps: DraggerProps = {
    name: 'file',
    maxCount: MAX_FILES, // doesn't actually seem to do anything, hence the checks in other places
    fileList,
    multiple: true,
    accept: NFT_MIME_TYPE_UPLOAD_VALIDATION_STRING,
    showUploadList: false,
    style: {
      background: 'rgba(255,255,255,0.1)',
      border: '1px dashed rgba(255, 255, 255, 0.2)',
      boxSizing: 'border-box',
      marginTop: 50,
    },

    onChange(info) {
      count++;
      const { size, name } = info.file;

      if (size && size > MAX_FILE_SIZE) {
        notification.error({
          message: `The file name ${name} you are trying to upload is ${(size / 1000000).toFixed(
            0
          )}MB, only files equal to or under ${MAX_FILE_SIZE / 1000000}MB are allowed`,
        });
        resetAll();
        return;
      }

      if (count === info.fileList.length) {
        setFileList([]); // reset local File upload state
        nextStep!();
      }
    },
    beforeUpload: (file) => {
      dispatch({ type: 'ADD_FILE', payload: file });

      return false;
    },
  };

  return (
    <StyledLayout>
      <Header>Add images or videos to create NFTs</Header>
      <Dragger {...draggerProps}>
        <StyledSpace direction="vertical" size={24}>
          <Space direction="vertical">
            <Copy>Drag up to 10 files here.</Copy>
            <Copy transparent style={{ fontSize: 14 }}>
              Supported file types: jpg, png, gif, mp4, mov, mp3, wav, flac, glb
            </Copy>
          </Space>

          <Copy transparent>or</Copy>
          <Button type="primary" size="large">
            Browse Files
          </Button>
        </StyledSpace>
      </Dragger>
    </StyledLayout>
  );
}
