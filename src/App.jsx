import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import LampScene from './components/LampScene'
import { Leva, useControls, useCreateStore } from 'leva'
import { generateSlatsSVG, generateDonutSVG } from './export/generateSVG'
import { Layout, Button, Upload, message, Space, Typography, Card, Modal } from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { Helmet } from 'react-helmet'

const { Header, Content } = Layout
const { Text } = Typography

const schema = {
  height: { value: 300, min: 100, max: 500 },
  radius: { value: 100, min: 50, max: 200 },
  slats: { value: 40, min: 10, max: 100, step: 1 },
  roundiness: { value: 0, min: 0, max: 5 },
  baseSize: { value: 20, min: 0, max: 200 },

  lfo1Shape: { options: ['sine', 'triangle', 'square', 'flat'], value: 'flat' },
  lfo1Frequency: { value: 1, min: 0.1, max: 100, step: 0.1 },
  lfo1Amplitude: { value: 200, min: 0, max: 100 },
  lfo1PhaseRandomness: { value: 0, min: 0, max: 1 },
  lfo1AmplitudeRandomness: { value: 0, min: 0, max: 1 },

  lfo2Shape: { options: ['sine', 'triangle', 'square', 'flat'], value: 'flat' },
  lfo2Frequency: { value: 1, min: 0.1, max: 100 },
  lfo2Amplitude: { value: 200, min: 0, max: 100 },
  lfo2PhaseRandomness: { value: 0, min: 0, max: 1 },
  lfo2AmplitudeRandomness: { value: 0, min: 0, max: 1 },

  coneAngle: { value: 0, min: -0.5, max: 0.5 },
  spiralTwistAngle: { value: 0, min: -1, max: 1 },
  blindsTiltAngle: { value: 0, min: -1, max: 1 },
  opacity: { value: 0.5, min: 0, max: 1 },
  color: { value: '#ffffff' },
}

export default function App() {
  const store = useCreateStore()
  const params = useControls(schema, { store })

  const [svgPreview, setSvgPreview] = useState(null)
  const [modalTitle, setModalTitle] = useState('')

  const handleDownload = (svgContent, filename) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
  }

  const handleShowPreview = (type) => {
    const svg = type === 'slats' ? generateSlatsSVG(params) : generateDonutSVG(params)
    setModalTitle(type === 'slats' ? 'Slats SVG Preview' : 'Donuts SVG Preview')
    setSvgPreview(svg)
  }

  const handleExportState = () => {
    const blob = new Blob([JSON.stringify(params, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lamp_params.json'
    link.click()
  }

  const handleImportState = (file) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target.result)
        Object.entries(importedState).forEach(([key, value]) => {
          if (schema[key]) {
            store.setValue(key, value)
          }
        })
        store.refresh()
        message.success('State imported successfully')
      } catch {
        message.error('Failed to import state file')
      }
    }
    reader.readAsText(file)
    return false
  }

  return (
    <>
      <Helmet>
        <title>Parametric Lamp Generator</title>
      </Helmet>

      <Layout style={{ height: '100vh' }}>
        <Header
          style={{
            background: '#1a1a1a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
            Parametric Lamp Generator
          </div>
          <Space>
            <Button icon={<EyeOutlined />} onClick={() => handleShowPreview('slats')}>
              Slats SVG
            </Button>
            <Button icon={<EyeOutlined />} onClick={() => handleShowPreview('donuts')}>
              Donuts SVG
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportState}>
              Export State
            </Button>
            <Upload beforeUpload={handleImportState} accept=".json" showUploadList={false}>
              <Button icon={<UploadOutlined />}>Import State</Button>
            </Upload>
          </Space>
        </Header>

        <Content style={{ position: 'relative' }}>
          <Leva store={store} style={{ top: 64 }} />
          <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, width: 220 }}>
            <Card title="Instructions" size="small" bordered>
              <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                <li>Drag: rotate</li>
                <li>Scroll: zoom</li>
                <li>Right-drag: pan</li>
              </ul>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Export laser-ready SVGs from top menu
              </Text>
            </Card>
          </div>

          <Canvas camera={{ fov: 100, position: [0, 0, 600] }} style={{ height: '100%' }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[1, 1, 1]} />
            <OrbitControls />
            <LampScene params={params} />
          </Canvas>
        </Content>
      </Layout>

      <Modal
        open={!!svgPreview}
        onCancel={() => setSvgPreview(null)}
        title={modalTitle}
        width="70vw"
        footer={
          <Button
            type="primary"
            onClick={() =>
              handleDownload(svgPreview, `${modalTitle.replace(' ', '_').toLowerCase()}.svg`)
            }
          >
            Download SVG
          </Button>
        }
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
      >
        <div dangerouslySetInnerHTML={{ __html: svgPreview }} />
      </Modal>
    </>
  )
}
