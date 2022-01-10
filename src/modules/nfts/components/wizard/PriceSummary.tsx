import { Divider, Form, Row, Col } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { StepWizardChildProps } from 'react-step-wizard';
import styled from 'styled-components';
import Button from '@/common/components/elements/Button';
import Paragraph from 'antd/lib/typography/Paragraph';
import { Coingecko, Currency } from '@metaplex/js';
import NavContainer from '@/modules/nfts/components/wizard/NavContainer';
import { WalletContext } from '@/modules/wallet';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { NFTPreviewGrid } from '@/common/components/elements/NFTPreviewGrid';
import { FilePreview } from 'pages/nfts/new';
import { useAnalytics } from '@/modules/ganalytics/AnalyticsProvider';

const SOL_COST_PER_NFT = 0.01;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 16px;
  row-gap: 16px;
  grid-template-rows: 100px 100px 100px 100px 100px;
`;

const StyledDivider = styled(Divider)`
  background-color: rgba(255, 255, 255, 0.1);
`;

const ButtonFormItem = styled(Form.Item)`
  .ant-form-item-control-input-content {
    display: flex;
    flex-direction: row-reverse;
  }
`;

async function getSolRate() {
  const rates = await new Coingecko().getRate([Currency.SOL], Currency.USD);
  return rates[0].rate;
}

interface Props extends Partial<StepWizardChildProps> {
  files: Array<File>;
  filePreviews: Array<FilePreview>;
  connection: Connection;
  clearForm: () => void;
}

export default function PriceSummary({
  previousStep,
  goToStep,
  filePreviews,
  files,
  nextStep,
  connection,
  clearForm,
}: Props) {
  const [totalSolCost, setTotalSolCost] = useState(files.length * SOL_COST_PER_NFT);
  const [totalInUSD, setTotalInUSD] = useState(0.0);
  const { wallet } = useContext(WalletContext);
  const [solBalanceInLamports, setSolBalance] = useState(-1);
  const hasEnoughSol =
    (solBalanceInLamports === -1 || solBalanceInLamports) >= totalSolCost * SOL_COST_PER_NFT;

  const { track } = useAnalytics();

  useEffect(() => {
    if (wallet) {
      connection
        .getBalance(new PublicKey(wallet.pubkey))
        .then((balance) => setSolBalance(balance / LAMPORTS_PER_SOL));
    }
  }, [wallet, connection]);

  useEffect(() => {
    const total = files.length * SOL_COST_PER_NFT;
    setTotalSolCost(total);

    getSolRate().then((rate) => {
      setTotalInUSD(rate * total);
    });
  }, [files, setTotalSolCost, setTotalInUSD]);

  if (!wallet) {
    return null;
  }

  const handleNext = () => {
    track('Mint price Confirmed', {
      event_category: 'Minter',
      userSolBalance: solBalanceInLamports,
      costToMint: totalSolCost,
      sol_value: totalSolCost,
      hasEnoughSol,
    });
    nextStep!();
  };

  return (
    <NavContainer
      title="Fees"
      previousStep={previousStep}
      goToStep={goToStep}
      clearForm={clearForm}
    >
      <Row>
        <Col style={{ width: 360 }}>
          <Row>
            <Paragraph style={{ fontWeight: 900 }}>Cost to mint {files.length} NFTs</Paragraph>
          </Row>
          <Row>
            <Col style={{ width: '100%' }}>
              <Row justify="space-between">
                <Paragraph style={{ fontSize: 14, opacity: 0.6 }}>
                  Estimated network fee x{files.length}
                </Paragraph>
                <Paragraph style={{ fontSize: 14 }}>
                  <span className="sol-icon">◎</span> {SOL_COST_PER_NFT}
                </Paragraph>
              </Row>
            </Col>
          </Row>
          <StyledDivider />
          <Row justify="space-between">
            <Paragraph style={{ opacity: 0.6, fontSize: 14 }}>Total:</Paragraph>
            <Col>
              <Row>
                <Paragraph style={{ fontSize: 18, marginBottom: 0 }}>
                  <span className="sol-icon">◎</span> {totalSolCost}
                </Paragraph>
              </Row>
              <Row justify="end">
                <Paragraph style={{ fontSize: 14, opacity: 0.6 }}>
                  ${totalInUSD.toFixed(2)}
                </Paragraph>
              </Row>
            </Col>
          </Row>
          <Row justify="end">
            {!hasEnoughSol && (
              <Paragraph style={{ fontSize: 14, color: '#D24040' }}>
                Not enough SOL in this wallet.
              </Paragraph>
            )}
          </Row>
          <Row justify="end">
            <ButtonFormItem style={{ marginTop: 20 }}>
              <Button type="primary" onClick={handleNext} disabled={!hasEnoughSol}>
                Mint {files.length} NFTs
              </Button>
            </ButtonFormItem>
          </Row>
        </Col>
        <StyledDivider type="vertical" style={{ margin: '0 46px', height: 500 }} />
        <NFTPreviewGrid filePreviews={filePreviews} />
      </Row>
    </NavContainer>
  );
}
