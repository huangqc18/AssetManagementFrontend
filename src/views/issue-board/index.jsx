import React from 'react'
import { connect } from 'react-redux'
import HelpCard from '../../components/HelpCard'
import { Button, Card, Divider, Modal, Table } from 'antd'
import { handleIssue, issueToHandle, handleRequire, getRequireAsset } from '../../api/issue'
import { transIssueList } from '../../utils/issue'
import { handleResponse } from '../../utils/response'
import { getList } from '../../utils/list'
import RequireModal from './require-modal'
import { refuseColor } from '../../utils/style'
import { getColumnSearchProps } from '../../utils/table'

const Column = Table.Column

class IssueBoard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      opType: '',
      issueList: [],
      rowData: {},
      modalVis: false,
      modalLod: false,
      assetList: [],
      requireModalVis: false,
      requireModalConfirmLoading: false,
      requireModalLod: false,
      selectedRowKeys: [],
      searchText: '',
      searchedColumn: ''
    }
  }

  getIssue = async () => {
    await getList(issueToHandle, this, 'issueList')
    transIssueList(this)
  }

  componentDidMount () {
    this.getIssue()
  }

  render () {
    const issueList = this.state.issueList
    const description = '作为企业员工，在这里可以看到其他员工向你提交的待处理事项'
    let modalText = ''
    let modalTitle = ''
    if ('type_name' in this.state.rowData) {
      modalText = '是否' + this.state.opType + '申请？'
      modalTitle = this.state.opType + '申请'
      if (this.state.rowData.type_name === 'MAINTAIN') {
        modalText = '维保' + (this.state.opType === '同意' ? '成功' : '失败') + '?'
        modalTitle = '维保' + (this.state.opType === '同意' ? '成功' : '失败')
      }
    }
    return (
      <div className='app-container'>
        <HelpCard title='待办事项' source={description}/>
        <br/>
        <Card>
          <Table
            bordered rowKey="nid"
            dataSource={issueList}
            expandIconColumnIndex={-1}
            childrenColumnName='tableChild' // ignore
            pagination={false}>
            <Column title="发起人" dataIndex="initiator" key="initiator" align="center"
              {...getColumnSearchProps('initiator', this, '发起人')}/>
            <Column title="事件类型" dataIndex='chiType' key="chiType" align="center"
              {...getColumnSearchProps('chiType', this, '事件类型')}/>
            <Column title="涉及资产" dataIndex="asset" key="asset" align="center"
              {...getColumnSearchProps('asset', this, '涉及资产')}/>
            <Column title="信息" dataIndex="info" key="info" align="center"
              {...getColumnSearchProps('info', this, '信息')}/>
            <Column title="操作" key="action" width={200} align="center" render={(row) => (
              <span>
                <Button type="primary" shape="circle" icon="check" title="批准"
                  onClick={this.handlePermit.bind(this, row)}/>
                <Divider type="vertical"/>
                <Button type="primary" shape="circle" icon="close" title="拒绝"
                  onClick={this.handleRefuse.bind(this, row)} style={refuseColor}/>
              </span>)}/>
          </Table>
        </Card>
        <Modal
          title={modalTitle}
          visible={this.state.modalVis}
          confirmLoading={this.state.modalLod}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <p>{modalText}</p>
        </Modal>
        <RequireModal
          visible={this.state.requireModalVis}
          loading={this.state.requireModalLod}
          confirmLoading={this.state.requireModalConfirmLoading}
          assetList={this.state.assetList}
          onCancel={() => {
            this.setState({
              requireModalVis: false
            })
          }}
          onChange={(selectedRowsKeys) => {
            this.setState({ selectedRowKeys: selectedRowsKeys })
          }}
          onOk={() => {
            this.setState({ requireModalConfirmLoading: true })
            handleResponse(handleRequire({
              selectedRows: this.state.selectedRowKeys,
              nid: this.state.rowData.nid
            }), '审批', this, null, {
              requireModalVis: false,
              requireModalConfirmLoading: false,
              selectedRowKeys: []
            }, this.getIssue)
          }}
          selectedRowKeys={this.state.selectedRowKeys}
        />
      </div>
    )
  }

  // handlePermitRequire = (selectedRows) => {
  //   handleRes ponse()
  // }

  handlePermit = (row) => {
    if (row.type_name === 'REQUIRE') {
      this.setState({
        requireModalVis: true,
        requireModalLod: true,
        rowData: Object.assign({}, row)
      })
      getRequireAsset(row).then((data) => {
        this.setState({
          assetList: data.data.data,
          requireModalLod: false
        })
      })
    } else {
      this.setState({
        modalVis: true,
        opType: '同意',
        rowData: Object.assign({}, row)
      })
    }
  }

  handleRefuse = (row) => {
    this.setState({
      modalVis: true,
      opType: '拒绝',
      rowData: Object.assign({}, row)
    })
  }

  handleOk = () => {
    this.setState({
      modalLod: true
    })
    const data = {
      nid: this.state.rowData.nid,
      success: (this.state.opType === '同意'),
      type_name: this.state.rowData.type_name
    }
    handleResponse(handleIssue(data), this.state.opType + '申请', this, null,
      { modalVis: false, modalLod: false }, this.getIssue)
  }

  handleCancel = () => {
    this.setState({
      modalVis: false
    })
  }
}

export default connect(state => state.user)(IssueBoard)
