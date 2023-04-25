<script setup lang="ts">
import {
  getIncomers,
  GraphNode,
  Position,
  SelectionMode,
  useVueFlow,
  VueFlow
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { computed, ref } from 'vue'
import { ChatOpenAI } from 'langchain/chat_models/openai'

import {
  HumanChatMessage,
  SystemChatMessage,
  AIChatMessage
} from 'langchain/schema'

const model = new ChatOpenAI({
  openAIApiKey: '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',
  temperature: 0.7,
  modelName: 'gpt-4'
})

const {
  onPaneReady,
  onNodeDoubleClick,
  addNodes,
  addEdges,
  onNodeClick,
  getSelectedNodes: selectedNodes,
  getIntersectingNodes,
  updateNodeInternals,
  findNode,
  onPaneClick,
  selectionMode,
  viewport
} = useVueFlow({
  selectionMode: SelectionMode.Full
})

const maxNodeWidth = 250

const elements = ref([
  {
    id: '1',
    label: `it's a brainstorm session, do not talk much, just type your ideas based on the prompt.`,
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    width: () => {
      return maxNodeWidth
    },
    data: {
      role: 'system',
      message: `it's a brainstorm session, do not talk much, just type your ideas based on the prompt.`
    },
    position: {
      x: 0,
      y: 0
    }
  }
])

// func getPathToRoot find the path from a node to the root
const getPathToRoot = (node: GraphNode) => {
  const path = [node]
  let currentNode = node
  while (true) {
    const incomers = getIncomers(currentNode, elements.value)
    if (incomers.length === 0) break
    currentNode = incomers[0]
    path.push(currentNode)
  }
  return path
}

const selectedConversation = computed(() => {
  const nodes = selectedNodes.value
  if (nodes.length === 0) return null

  const node = nodes[0]

  const path = getPathToRoot(node)
  return path.reverse().map((node) => {
    if (node.data.role === 'user') {
      return new HumanChatMessage(node.data.message as string)
    } else if (node.data.role === 'system') {
      return new SystemChatMessage(node.data.message as string)
    } else if (node.data.role === 'assistant') {
      return new AIChatMessage(node.data.message as string)
    }
  })
})

const prompt = ref('')

const insertNote = (text: string) => {
  const promptNodeID = Math.random().toString(36).substr(2, 9)
  const node = {
    id: promptNodeID,
    label: text,
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    data: {
      role: 'user',
      message: text
    },
    width: () => {
      return maxNodeWidth
    },
    position: {
      x: 0,
      y: 0
    }
  }

  if (selectedNodes.value.length > 0) {
    const selectedNode = selectedNodes.value[0]
    node.position.x = selectedNode.position.x + maxNodeWidth + 50
    node.position.y = selectedNode.position.y
  }

  addNodes([node])

  selectedNodes.value.forEach((selectedNode) => {
    addEdges([
      {
        id: `edge-${selectedNode.id}-${node.id}`,
        source: selectedNode.id,
        target: node.id
      }
    ])
  })
}
const onPromptSubmit = async () => {
  for (const node of selectedNodes.value) {
    const promptNode = Math.random().toString(36).substr(2, 9)

    const promptPosition = {
      x: node.position.x + maxNodeWidth + 50,
      y: node.position.y
    }

    addNodes([
      {
        id: promptNode,
        label: prompt.value,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        width: () => {
          return maxNodeWidth
        },
        data: {
          role: 'user',
          message: prompt.value
        },
        position: promptPosition
      }
    ])

    addEdges([
      {
        id: `e${node.id}-${promptNode}`,
        source: node.id,
        target: promptNode
      }
    ])

    const res = await model.call([
      ...selectedConversation.value,
      new HumanChatMessage(prompt.value)
    ])

    const answer = res.text.trim()
    const questions = answer.split('\n')

    for (let index = 0; index < questions.length; index++) {
      const question = questions[index]
      if (question.trim() === '') continue

      const answerNodeId = Math.random().toString(36).substr(2, 9)

      addNodes([
        {
          id: answerNodeId,
          label: question,
          targetPosition: Position.Left,
          sourcePosition: Position.Right,
          width: () => {
            return maxNodeWidth
          },
          data: {
            role: 'assistant',
            message: question
          },
          position: {
            x: promptPosition.x + maxNodeWidth + 50,
            y: promptPosition.y + 80 * (questions.length / 2 - index) - 40
          }
        }
      ])

      addEdges([
        {
          id: `e${promptNode}-${answerNodeId}`,
          source: promptNode,
          target: answerNodeId
        }
      ])
    }
  }

  prompt.value = ''
}

onPaneReady(({ fitView }) => {
  fitView()
})
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.sidebar">
      <div>
        <p v-for="conversation in selectedConversation">
          {{ conversation.text }}
        </p>
      </div>
      <div>
        <el-input v-model="prompt"></el-input>
        <el-button @click="insertNote(prompt)">Inject</el-button>
        <el-button @click="onPromptSubmit">Generate</el-button>
      </div>
    </div>
    <VueFlow v-model="elements">
      <Background pattern-color="#aaa" gap="8" />
      <Controls />
    </VueFlow>
  </div>
</template>

<style module lang="stylus">
.container
  display: grid
  grid-template-columns 250px 1fr
  height: 100vh
  width: 100vw
  background-color: #eee
.sidebar
  border-right: 1px solid #ccc
  display grid
  grid-template-rows 1fr 100px
</style>
