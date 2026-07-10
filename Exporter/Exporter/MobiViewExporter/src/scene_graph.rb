# encoding: UTF-8

module MobiViewExporter

  module SceneGraph

    extend self

    ###############################################

    def build(project_name, pieces)

      root = SceneNode.new(

        "project",

        "root",

        project_name

      )

      modules = {}

      pieces.each do |piece|

        module_id = piece[:module_id] || "sem_modulo"

        unless modules[module_id]

          node = SceneNode.new(

            "module",

            module_id,

            "Módulo #{module_id}"

          )

          modules[module_id] = node

          root.add(node)

        end

        piece_node = SceneNode.new(

          "piece",

          piece[:mv_uuid],

          piece[:name]

        )

        piece_node.data = {

          code: piece[:code],

          material: piece[:material],

          persistent_id: piece[:persistent_id],

          geometry: piece[:geometry]

        }

        modules[module_id].add(piece_node)

      end

      root

    end

  end

end