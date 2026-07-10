# encoding: UTF-8

module MobiViewExporter

  class SceneNode

    attr_accessor :id
    attr_accessor :type
    attr_accessor :name
    attr_accessor :parent
    attr_accessor :children
    attr_accessor :data

    def initialize(type, id, name)

      @type = type
      @id = id
      @name = name

      @parent = nil
      @children = []

      @data = {}

    end

    ###############################################

    def add(node)

      node.parent = self

      @children << node

    end

    ###############################################

    def to_h

      {

        id: id,

        type: type,

        name: name,

        data: data,

        children: children.map(&:to_h)

      }

    end

  end

end