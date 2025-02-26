/**
 * @description editor react component
 * @author wangfupeng
 */

import React, { useRef, useEffect, useState } from 'react'
import {SlateDescendant, IEditorConfig, createEditor, IDomEditor, SlateEditor, SlateTransforms } from '@wangeditor/editor'

interface IProps {
  defaultContent?: SlateDescendant[]
  onCreated?: (editor: IDomEditor) => void
  defaultHtml?: string
  value?: string
  onChange: (editor: IDomEditor) => void
  defaultConfig: Partial<IEditorConfig>
  mode?: string
  style?: React.CSSProperties
}

function EditorComponent(props: Partial<IProps>) {
  const { defaultContent = [], onCreated, defaultHtml = '', value = '', onChange, defaultConfig = {}, mode = 'default', style = {} } = props
  const ref = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [curValue, setCurValue] = useState('')

  const handleCreated = (editor: IDomEditor) => {
    // 组件属性 onCreated
    if (onCreated) onCreated(editor)

    // 编辑器 配置 onCreated
    const { onCreated: onCreatedFromConfig } = defaultConfig
    if (onCreatedFromConfig) onCreatedFromConfig(editor)
  }

  const handleChanged = (editor: IDomEditor) => {
    setCurValue(editor.getHtml()) // 记录当前 html 值

    // 组件属性 onChange
    if (onChange) onChange(editor)

    // 编辑器 配置 onChange
    const { onChange: onChangeFromConfig } = defaultConfig
    if (onChangeFromConfig) onChangeFromConfig(editor)
  }

  const handleDestroyed = (editor: IDomEditor) => {
    const { onDestroyed } = defaultConfig
    setEditor(null)
    if(onDestroyed) {
      onDestroyed(editor)
    }
  }

  // value 变化，重置 HTML
  useEffect(() => {
    if (editor == null) return

    if (value === curValue) return // 如果和当前 html 值相等，则忽略

    // ------ 重新设置 HTML ------

    // 记录编辑器当前状态
    const isEditorDisabled = editor.isDisabled()
    const isEditorFocused = editor.isFocused()
    const editorSelectionStr = JSON.stringify(editor.selection)

    // 删除并重新设置 HTML
    editor.enable()
    editor.focus()
    editor.select([])
    editor.deleteFragment()
    // @ts-ignore
    SlateTransforms.setNodes(editor, { type: 'paragraph' }, { mode: 'highest' })
    editor.dangerouslyInsertHtml(value)

    // 恢复编辑器状态
    if (!isEditorFocused) {
      editor.deselect()
      editor.blur()
      return
    }
    if (isEditorDisabled) {
      editor.deselect()
      editor.disable()
      return
    }
    try {
      editor.select(JSON.parse(editorSelectionStr)) // 选中原来的位置
    } catch (ex) {
      editor.select(SlateEditor.start(editor, [])) // 选中开始
    }

  }, [value])

  useEffect(() => {
    if (ref.current == null) return
    if (editor != null) return

    const newEditor = createEditor({
      selector: ref.current,
      config: {
        ...defaultConfig,
        onCreated: handleCreated,
        onChange: handleChanged,
        onDestroyed: handleDestroyed,
      },
      content: defaultContent,
      html: defaultHtml || value,
      mode,
    })
    setEditor(newEditor)
  }, [editor])

  return <div style={style} ref={ref}></div>
}

export default EditorComponent
